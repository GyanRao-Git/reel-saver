import type { NextRequest } from "next/server";
import { isAuthenticated } from "./session";

export function requireSession(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return Response.json({ error: "Unlock the app to continue.", code: "UNAUTHORIZED" }, { status: 401 });
  }
  return null;
}

