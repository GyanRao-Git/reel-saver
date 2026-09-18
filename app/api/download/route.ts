import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { parseDownloadToken, sanitizeFilename } from "@/lib/download-token";
import { AppError, errorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PROXY_BYTES = 50 * 1024 * 1024;
const MAX_PROXY_DURATION = 10 * 60;

function sourceRedirect(url: string) {
  return Response.redirect(url, 307);
}

export async function GET(request: NextRequest) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) throw new AppError("The download token is missing.", 400, "MISSING_TOKEN");
    const data = parseDownloadToken(token);
    const shouldProxy =
      data.size !== null &&
      data.size <= MAX_PROXY_BYTES &&
      data.duration !== null &&
      data.duration <= MAX_PROXY_DURATION;
    if (!shouldProxy) return sourceRedirect(data.url);

    const upstreamHeaders = new Headers({ "user-agent": "Mozilla/5.0 ReelSave/1.0" });
    const range = request.headers.get("range");
    if (range && /^bytes=\d*-\d*$/.test(range)) upstreamHeaders.set("range", range);

    let upstream: Response;
    try {
      upstream = await fetch(data.url, {
        headers: upstreamHeaders,
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      return sourceRedirect(data.url);
    }
    if (!upstream.ok || !upstream.body) return sourceRedirect(data.url);

    const filename = `${sanitizeFilename(data.title)}.${data.ext}`;
    const headers = new Headers({
      "content-type": upstream.headers.get("content-type") || `video/${data.ext}`,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "accept-ranges": upstream.headers.get("accept-ranges") || "bytes",
    });
    for (const name of ["content-length", "content-range"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return errorResponse(error);
  }
}

