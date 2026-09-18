import type { NextRequest } from "next/server";
import { safeEqual, sign, verifySignature } from "./crypto";

export const SESSION_COOKIE = "reel_save_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

export function verifyPasscode(passcode: string) {
  const expected = process.env.APP_PASSCODE;
  return Boolean(expected) && safeEqual(sign(passcode), sign(expected!));
}

export function createSessionValue(now = Date.now()) {
  const expires = Math.floor(now / 1000) + SESSION_AGE_SECONDS;
  const payload = String(expires);
  return `${payload}.${sign(`session:${payload}`)}`;
}

export function isValidSessionValue(value?: string, now = Date.now()) {
  if (!value) return false;
  const [expires, signature, ...rest] = value.split(".");
  if (!expires || !signature || rest.length || Number(expires) <= Math.floor(now / 1000)) return false;
  return verifySignature(`session:${expires}`, signature);
}

export function isAuthenticated(request: NextRequest) {
  return isValidSessionValue(request.cookies.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_AGE_SECONDS,
};

