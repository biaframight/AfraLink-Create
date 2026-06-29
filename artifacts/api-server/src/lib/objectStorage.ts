import { randomUUID } from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "afralink-uploads";

const PATH_MARKER = "__path__";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  async getObjectEntityUploadURL(): Promise<string> {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel environment variables"
      );
    }

    const filePath = `uploads/${randomUUID()}`;

    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/upload/${BUCKET}/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upsert: true }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase storage error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { url?: string };
    const relOrAbsUrl = data.url ?? "";
    const signedUrl = relOrAbsUrl.startsWith("http")
      ? relOrAbsUrl
      : `${SUPABASE_URL}${relOrAbsUrl}`;

    return `${signedUrl}${PATH_MARKER}${filePath}`;
  }

  normalizeObjectEntityPath(rawUploadURL: string): string {
    const idx = rawUploadURL.lastIndexOf(PATH_MARKER);
    const filePath =
      idx !== -1
        ? rawUploadURL.slice(idx + PATH_MARKER.length)
        : `uploads/${randomUUID()}`;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
  }

  cleanUploadURL(rawUploadURL: string): string {
    const idx = rawUploadURL.lastIndexOf(PATH_MARKER);
    return idx !== -1 ? rawUploadURL.slice(0, idx) : rawUploadURL;
  }
}
