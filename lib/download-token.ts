import { AppError } from "./errors";
import { isAllowedMediaCdn } from "./media-url";
import { sign, verifySignature } from "./crypto";
import type { Platform } from "./types";

export type DownloadTokenData = {
  url: string;
  title: string;
  ext: string;
  size: number | null;
  duration: number | null;
  platform: Platform;
  exp: number;
};

export function createDownloadToken(data: Omit<DownloadTokenData, "exp">, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ ...data, exp: Math.floor(now / 1000) + 10 * 60 }),
  ).toString("base64url");
  return `${payload}.${sign(`download:${payload}`)}`;
}

export function parseDownloadToken(token: string, now = Date.now()): DownloadTokenData {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length || !verifySignature(`download:${payload}`, signature)) {
    throw new AppError("This download link is invalid.", 401, "INVALID_TOKEN");
  }

  let data: DownloadTokenData;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new AppError("This download link is invalid.", 401, "INVALID_TOKEN");
  }

  if (data.exp <= Math.floor(now / 1000)) {
    throw new AppError("This download link expired. Resolve the media again.", 410, "EXPIRED_TOKEN");
  }
  if (!isAllowedMediaCdn(data.url)) {
    throw new AppError("The media host is not allowed.", 400, "UNSAFE_MEDIA_HOST");
  }
  return data;
}

export function sanitizeFilename(value: string) {
  const clean = value
    .normalize("NFKD")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 100);
  return clean || "video";
}

