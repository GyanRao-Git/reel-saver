import { AppError } from "./errors";
import type { Platform } from "./types";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

export function parseMediaUrl(input: string): { url: string; platform: Platform } {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new AppError("Enter a complete Instagram or YouTube URL.", 400, "INVALID_URL");
  }

  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new AppError("Only secure HTTPS links are supported.", 400, "INVALID_URL");
  }

  const host = parsed.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    if (parsed.searchParams.has("list")) {
      throw new AppError("Playlists are not supported. Paste one video link.", 400, "PLAYLIST_UNSUPPORTED");
    }
    const valid =
      (host === "youtu.be" && /^\/[A-Za-z0-9_-]{6,}/.test(parsed.pathname)) ||
      (/^\/(shorts\/[^/]+|watch)$/.test(parsed.pathname) &&
        (parsed.pathname !== "/watch" || Boolean(parsed.searchParams.get("v"))));
    if (!valid) {
      throw new AppError("Use an individual YouTube video or Shorts link.", 400, "UNSUPPORTED_URL");
    }
    parsed.hash = "";
    return { url: parsed.toString(), platform: "youtube" };
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    if (!/^\/reels?\/[^/]+\/?$/.test(parsed.pathname)) {
      throw new AppError("Use a public Instagram Reel link.", 400, "UNSUPPORTED_URL");
    }
    parsed.search = "";
    parsed.hash = "";
    return { url: parsed.toString(), platform: "instagram" };
  }

  throw new AppError("Only Instagram Reels and YouTube videos are supported.", 400, "UNSUPPORTED_HOST");
}

export function isAllowedMediaCdn(input: string) {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return ["googlevideo.com", "cdninstagram.com", "fbcdn.net"].some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

