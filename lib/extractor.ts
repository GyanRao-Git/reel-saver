import youtubeDl from "youtube-dl-exec";
import { AppError } from "./errors";
import type { ExtractedMedia, Platform } from "./types";

export interface MediaExtractor {
  extract(url: string, platform: Platform): Promise<ExtractedMedia>;
}

export class YtDlpExtractor implements MediaExtractor {
  async extract(url: string): Promise<ExtractedMedia> {
    try {
      const result = await youtubeDl(
        url,
        {
          dumpSingleJson: true,
          skipDownload: true,
          noPlaylist: true,
          noWarnings: true,
          noCheckFormats: true,
          socketTimeout: 15,
          retries: 1,
        },
        { timeout: 25_000 },
      );
      if (!result || typeof result === "string" || Array.isArray(result)) {
        throw new AppError("The extractor returned an invalid response.", 502, "INVALID_EXTRACTOR_RESPONSE");
      }
      return result as ExtractedMedia;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("private") || message.includes("login") || message.includes("sign in")) {
        throw new AppError("This media is private or requires a login.", 422, "LOGIN_REQUIRED");
      }
      if (message.includes("unsupported url")) {
        throw new AppError("That link is not supported by the current extractor.", 422, "EXTRACTOR_UNSUPPORTED");
      }
      if (message.includes("timed out") || message.includes("timeout")) {
        throw new AppError("The media provider took too long to respond.", 504, "UPSTREAM_TIMEOUT");
      }
      throw error;
    }
  }
}

export const mediaExtractor: MediaExtractor = new YtDlpExtractor();
