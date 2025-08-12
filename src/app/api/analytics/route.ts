
// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getAnalyticsData } from "@/lib/services/analytics.service";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const targetLanguage = url.searchParams.get("targetLanguage");
    const predictionHorizon = url.searchParams.get("predictionHorizon") || '3m';

    const schema = z.object({
      targetLanguage: z.string().min(1, { message: "targetLanguage is required" }),
      predictionHorizon: z.enum(['1m', '3m', '1y']),
    });

    const validation = schema.safeParse({ targetLanguage, predictionHorizon });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    
    const horizonDaysMap = {
      '1m': 30,
      '3m': 90,
      '1y': 365
    };
    const predictionHorizonDays = horizonDaysMap[validation.data.predictionHorizon];

    const analyticsData = await getAnalyticsData(user.id, validation.data.targetLanguage, predictionHorizonDays);

    return NextResponse.json(analyticsData);
  } catch (error) {
    logger.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}