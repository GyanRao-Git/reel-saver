import { type NextRequest, NextResponse } from "next/server";
import {
  createSessionValue,
  isAuthenticated,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPasscode,
} from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return Response.json({ authenticated: isAuthenticated(request) });
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
      return Response.json({ error: "Expected a JSON request." }, { status: 415 });
    }
    const origin = request.headers.get("origin");
    const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (origin && (!requestHost || new URL(origin).host !== requestHost)) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const body = (await request.json()) as { passcode?: unknown };
    if (typeof body.passcode !== "string" || !verifyPasscode(body.passcode)) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return Response.json({ error: "That passcode is not correct." }, { status: 401 });
    }
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
