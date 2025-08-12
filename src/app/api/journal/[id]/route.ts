// Note: This route handles decryption of sensitive user data before sending it to the client.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { decrypt, encrypt } from "@/lib/encryption";

// GET handler to fetch a single journal with its analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Journal ID is required" },
      { status: 400 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const journal = await prisma.journalEntry.findFirst({
    where: {
      id,
      authorId: user.id,
    },
    include: {
      topic: true,
      analysis: {
        include: {
          mistakes: true,
        },
      },
    },
  });

  if (!journal)
    return NextResponse.json({ error: "Journal not found" }, { status: 404 });

  // Decrypt fields
  const decryptedContent = decrypt(journal.content);
  if (decryptedContent === null) {
    logger.error(
      `Failed to decrypt critical content for journal ${id}. Cannot proceed.`,
    );
    return NextResponse.json(
      { error: "Failed to decrypt journal content" },
      { status: 500 },
    );
  }
  journal.content = decryptedContent;

  if (journal.analysis) {
    const analysis = journal.analysis as any;
    analysis.feedbackJson = decrypt(analysis.feedbackJson);

    const decryptedRawResponse = decrypt(analysis.rawAiResponse);
    analysis.rawAiResponse = decryptedRawResponse
      ? JSON.parse(decryptedRawResponse)
      : null;

    if (analysis.mistakes) {
      analysis.mistakes = analysis.mistakes.map((mistake: any) => {
        mistake.originalText = decrypt(mistake.originalText);
        mistake.correctedText = decrypt(mistake.correctedText);
        mistake.explanation = decrypt(mistake.explanation);
        return mistake;
      });
    }
  }
  logger.info(`Responding with journal data for id: ${id}`);

  return NextResponse.json(journal);
}

const updateJournalSchema = z.object({
  content: z.string().min(1),
  topicId: z.string(),
});

// PUT handler to update a journal
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Journal ID is required" },
        { status: 400 },
      );
    }
    const { params } = context;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    logger.info(`/api/journal/${id} - PUT - User: ${user.id}`, body);

    const parsed = updateJournalSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { content, topicId } = parsed.data;

    const updatedJournal = await prisma.journalEntry.update({
      where: {
        id,
        authorId: user.id,
      },
      data: {
        content: encrypt(content),
        topicId,
      },
    });

    return NextResponse.json(updatedJournal);
  } catch (error) {
    logger.error(`/api/journal/[id] - PUT failed`, error);
    return NextResponse.json(
      { error: "Failed to update journal" },
      { status: 500 },
    );
  }
}

// DELETE handler to remove a journal
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Journal ID is required" },
        { status: 400 },
      );
    }
    const { params } = context;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    logger.info(`/api/journal/${id} - DELETE - User: ${user.id}`);

    await prisma.journalEntry.delete({
      where: {
        id,
        authorId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`/api/journal/[id] - DELETE failed`, error);
    return NextResponse.json(
      { error: "Failed to delete journal" },
      { status: 500 },
    );
  }
}