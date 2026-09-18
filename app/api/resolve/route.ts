import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { AppError, errorResponse } from "@/lib/errors";
import { mediaExtractor } from "@/lib/extractor";
import { normalizeFormats } from "@/lib/format";
import { parseMediaUrl } from "@/lib/media-url";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string") {
      throw new AppError("Enter a media URL.", 400, "INVALID_URL");
    }
    const parsed = parseMediaUrl(body.url);
    const media = await mediaExtractor.extract(parsed.url, parsed.platform);
    if (media.is_live || ["is_live", "is_upcoming"].includes(media.live_status ?? "")) {
      throw new AppError("Live and upcoming streams are not supported.", 422, "LIVE_UNSUPPORTED");
    }
    if (["private", "premium_only", "subscriber_only", "needs_auth"].includes(media.availability ?? "")) {
      throw new AppError("This media is not publicly available.", 422, "LOGIN_REQUIRED");
    }

    const title = media.title?.trim() || "video";
    const duration = typeof media.duration === "number" ? media.duration : null;
    const formats = normalizeFormats(media.formats ?? [], {
      title,
      duration,
      platform: parsed.platform,
    });
    if (!formats.length) {
      throw new AppError(
        "No ready-to-download format with audio was found for this link.",
        422,
        "NO_FORMATS",
      );
    }
    return Response.json({
      platform: parsed.platform,
      title,
      thumbnail: media.thumbnail || null,
      duration,
      formats,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

