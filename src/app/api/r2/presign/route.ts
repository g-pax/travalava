import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Only allow image uploads; key extension is derived from the content type
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

let s3Client: S3Client | null = null;

/** Lazily build the R2 client; returns null when credentials are missing. */
function getS3Client(): S3Client | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true, // important for non-AWS S3 providers
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

export async function POST(req: Request) {
  try {
    // Same-origin API: require an authenticated Supabase user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const s3 = getS3Client();
    if (!s3 || !process.env.R2_BUCKET) {
      return NextResponse.json(
        { error: "Storage is not configured" },
        { status: 500 },
      );
    }

    const body: unknown = await req.json().catch(() => null);
    const { contentType, fileName } = (body ?? {}) as {
      contentType?: unknown;
      fileName?: unknown;
    };

    if (typeof contentType !== "string" || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "contentType and fileName are required" },
        { status: 400 },
      );
    }

    const extension = ALLOWED_CONTENT_TYPES[contentType];
    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 },
      );
    }

    // Generate safe file name
    const timestamp = Date.now();
    const randomId = nanoid(8);

    // Handle folder paths (e.g., "feedback/screenshot.jpg")
    const pathParts = fileName.split("/");
    const actualFileName = pathParts.pop() || fileName;
    const folderPath = pathParts.join("/");

    const safeFileName = actualFileName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const finalFileName = `${safeFileName}-${timestamp}-${randomId}.${extension}`;
    const key = folderPath ? `${folderPath}/${finalFileName}` : finalFileName;

    // No CacheControl here: the client upload sends only Content-Type, and any
    // extra signed header would cause SignatureDoesNotMatch on PUT.
    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      key,
      fileName: finalFileName,
    });
  } catch (error) {
    console.error("R2 presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}
