import { createDownloadToken, sanitizeFilename } from "./download-token";
import { isAllowedMediaCdn } from "./media-url";
import type { DownloadFormat, Platform, RawFormat } from "./types";

const PROXY_MAX_BYTES = 50 * 1024 * 1024;
const PROXY_MAX_DURATION = 10 * 60;

export function normalizeFormats(
  formats: RawFormat[],
  meta: { title: string; duration: number | null; platform: Platform },
): DownloadFormat[] {
  const candidates = formats.filter(
    (item) =>
      item.url &&
      isAllowedMediaCdn(item.url) &&
      item.vcodec &&
      item.vcodec !== "none" &&
      item.acodec &&
      item.acodec !== "none" &&
      ["https", "http"].includes(item.protocol ?? "https") &&
      ["mp4", "webm"].includes((item.ext ?? "").toLowerCase()),
  );

  const preferred = new Map<string, RawFormat>();
  for (const item of candidates) {
    const height = item.height ?? 0;
    const key = String(height);
    const current = preferred.get(key);
    const itemScore = item.ext === "mp4" ? 2 : 1;
    const currentScore = current?.ext === "mp4" ? 2 : current ? 1 : 0;
    if (!current || itemScore > currentScore || (item.filesize ?? 0) > (current.filesize ?? 0)) {
      preferred.set(key, item);
    }
  }

  return [...preferred.values()]
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .map((item) => {
      const size = item.filesize ?? item.filesize_approx ?? null;
      const ext = (item.ext ?? "mp4").toLowerCase();
      const delivery =
        size !== null &&
        size <= PROXY_MAX_BYTES &&
        meta.duration !== null &&
        meta.duration <= PROXY_MAX_DURATION
          ? "proxy"
          : "source";
      const token = createDownloadToken({
        url: item.url!,
        title: sanitizeFilename(meta.title),
        ext,
        size,
        duration: meta.duration,
        platform: meta.platform,
      });
      return {
        id: item.format_id ?? `${item.height ?? "unknown"}-${ext}`,
        label: item.height ? `${item.height}p` : item.format_note || "Original",
        ext,
        height: item.height ?? null,
        size,
        delivery,
        downloadUrl: `/api/download?token=${encodeURIComponent(token)}`,
      };
    });
}

