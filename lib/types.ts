export type Platform = "youtube" | "instagram";

export type DownloadFormat = {
  id: string;
  label: string;
  ext: string;
  height: number | null;
  size: number | null;
  delivery: "proxy" | "source";
  downloadUrl: string;
};

export type ResolvedMedia = {
  platform: Platform;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: DownloadFormat[];
};

export type RawFormat = {
  format_id?: string;
  format_note?: string;
  ext?: string;
  protocol?: string;
  container?: string;
  audio_ext?: string;
  video_ext?: string;
  acodec?: string;
  vcodec?: string;
  url?: string;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  tbr?: number | null;
};

export type ExtractedMedia = {
  title?: string;
  thumbnail?: string;
  duration?: number | null;
  is_live?: boolean;
  live_status?: string;
  availability?: string;
  formats?: RawFormat[];
};
