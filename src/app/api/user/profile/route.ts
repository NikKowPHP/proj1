import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      email: true,
      nativeLanguage: true,
      defaultTargetLanguage: true,
      writingStyle: true,
      writingPurpose: true,
      selfAssessedLevel: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      onboardingCompleted: true,
      languageProfiles: true,
      goals: true,
      _count: {
        select: {
          srsItems: true,
        },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(dbUser);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    logger.info(`/api/user/profile - PUT - User: ${user.id}`, body);

    const { newTargetLanguage, ...profileData } = body;

    // If a new language is being added, create the language profile.
    if (newTargetLanguage) {
      await prisma.languageProfile.upsert({
        where: {
          userId_language: { userId: user.id, language: newTargetLanguage },
        },
        create: { userId: user.id, language: newTargetLanguage },
        update: {},
      });
    }

    // Handle the rest of the profile data update.
    const { targetLanguage, ...restOfBody } = profileData;
    const dataToUpdate: Prisma.UserUpdateInput = { ...restOfBody };
    if (targetLanguage) {
      dataToUpdate.defaultTargetLanguage = targetLanguage;
    }

    // Only update the user if there's data to update.
    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error("Failed to update profile", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You are already learning this language." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}