import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

if (
  !process.env.R2_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY
) {
  throw new Error("Cloudflare R2 credentials are not set");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true, // important for non-AWS S3 providers
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// CORS headers for R2 uploads
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const { contentType, fileName } = await req.json();

    // Validate input
    if (!contentType || !fileName) {
      return NextResponse.json(
        { error: "contentType and fileName are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate safe file name
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const safeFileName = fileName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const key = `${safeFileName}.${extension}`;

    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1 year cache
    });

    const presignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    return NextResponse.json(
      {
        presignedUrl,
        publicUrl,
        key,
        fileName: `${safeFileName}-${timestamp}-${randomId}.${extension}`,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("R2 presign error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate presigned URL";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders },
    );
  }
}
