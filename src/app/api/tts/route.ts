import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { GoogleTTS } from "@/lib/services/google-tts.service";
import { ttsRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(500), // Max 500 chars to prevent abuse
  lang: z.string().min(2), // BCP-47 code e.g., 'en-US'
});

let googleTTS: GoogleTTS;

try {
  googleTTS = new GoogleTTS();
} catch (error) {
  logger.error("Failed to instantiate GoogleTTS service", error);
}

export async function POST(req: NextRequest) {
  if (!googleTTS) {
    return new NextResponse("TTS service is not configured", { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true },
    });

    const tier = dbUser?.subscriptionTier || "FREE";
    const limit = ttsRateLimiter(user.id, tier);
    if (!limit.allowed) {
      logger.warn(
        `[API:tts] Internal TTS rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        { error: "Daily audio generation limit reached." },
        {
          status: 429,
          headers: {
            "Retry-After": limit.retryAfter!.toString(),
          },
        },
      );
    }

    const body = await req.json();
    const parsed = ttsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { text, lang } = parsed.data;

    const voice = googleTTS.getVoice(lang, "hd");
    const audioContent = await googleTTS.synthesizeSpeech(text, lang, voice);

    return NextResponse.json({ audioContent });
  } catch (error) {
    logger.error("Error in TTS API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}