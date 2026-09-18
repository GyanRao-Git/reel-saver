export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }

  console.error(error);
  return Response.json(
    {
      error: "The media provider did not respond as expected. Try again later or update yt-dlp.",
      code: "UPSTREAM_ERROR",
    },
    { status: 502 },
  );
}

