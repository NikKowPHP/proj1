import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { PostHog } from "posthog-node";
import axios from "axios";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getAIService } from "@/lib/ai";

let posthog: PostHog | null = null;
if (
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  process.env.NEXT_PUBLIC_POSTHOG_HOST
) {
  posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

const imagePromptRequestSchema = z.object({
  targetLanguage: z.string(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = imagePromptRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { targetLanguage } = parsed.data;

    const aiService = getAIService();
    const { result: aiDescription } =
      await aiService.generateImageDescription(user.id);

    const unsplashApiKey = process.env.UNSPLASH_API_KEY;
    if (!unsplashApiKey) {
      logger.error("UNSPLASH_API_KEY not set. Cannot generate image prompt.");
      return NextResponse.json(
        { error: "Image service not configured" },
        { status: 503 },
      );
    }

    const response = await axios.get(
      "https://api.unsplash.com/photos/random",
      {
        headers: { Authorization: `Client-ID ${unsplashApiKey}` },
        params: { query: aiDescription, orientation: "landscape", count: 1 },
        timeout: 5000,
      },
    );

    const photo = response.data[0];
    if (!photo) {
      throw new Error("No photo returned from Unsplash API.");
    }

    const topic = await prisma.topic.upsert({
      where: {
        userId_title_targetLanguage: {
          userId: user.id,
          title: aiDescription,
          targetLanguage,
        },
      },
      update: {},
      create: {
        userId: user.id,
        title: aiDescription,
        targetLanguage,
        imageUrl: photo.urls.regular,
        type: "IMAGE",
      },
    });

    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "ImagePromptGenerated",
        properties: {
          topicId: topic.id,
          imageUrl: topic.imageUrl,
          source: "Unsplash (API)",
        },
      });
    }

    return NextResponse.json(topic);
  } catch (error) {
    logger.error("Error generating image prompt:", error);
    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "ImagePromptFailed",
        properties: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
    return NextResponse.json(
      { error: "Failed to generate image prompt" },
      { status: 500 },
    );
  } finally {
    if (posthog) await posthog.shutdown();
  }
}