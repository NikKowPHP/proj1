import { NextRequest, NextResponse } from "next/server";
import { jemMap } from "@/lib/mappings/jem.map";
import { jobTitlesMap } from "@/lib/mappings/job-titles.map";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobTitleValue = searchParams.get("jobTitle"); // e.g., 'welder'

  if (!jobTitleValue) {
    return NextResponse.json(
      { error: "jobTitle parameter is required" },
      { status: 400 },
    );
  }

  const iscoCode = jobTitlesMap[jobTitleValue];

  if (!iscoCode) {
    logger.info(
      `[API:suggest-exposures] No ISCO code found for jobTitle '${jobTitleValue}'.`,
    );
    return NextResponse.json([]);
  }

  const suggestedExposures = jemMap[iscoCode] || [];

  logger.info(
    `[API:suggest-exposures] JEM lookup for jobTitle '${jobTitleValue}' (ISCO: ${iscoCode}) found ${suggestedExposures.length} suggestions.`,
  );

  return NextResponse.json(suggestedExposures);
}
