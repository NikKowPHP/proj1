import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// POST for upload
export async function POST(request: Request): Promise<NextResponse> {
  const file = request.body;
  const originalFilename = new URL(request.url).searchParams.get("filename");

  if (!file || !originalFilename) {
    return NextResponse.json({ error: "No file to upload." }, { status: 400 });
  }

  try {
    const blob = await put(
      `reports/${nanoid()}/${originalFilename}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      },
    );

    return NextResponse.json(blob);
  } catch (error) {
    logger.error("Error uploading file to Vercel Blob", { error });
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}

// DELETE for cleanup
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "No URL to delete." }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.status === 404) {
      // If the file is already deleted (e.g., by the assess endpoint), this is not an error.
      logger.info("File to delete was not found, likely already deleted.", {
        error,
      });
      return NextResponse.json({ success: true });
    }
    logger.error("Error deleting file from Vercel Blob", { error });
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 },
    );
  }
}
      