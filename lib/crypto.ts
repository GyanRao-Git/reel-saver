import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "./errors";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new AppError("SESSION_SECRET must contain at least 32 characters.", 500, "MISCONFIGURED");
  }
  return value;
}

export function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifySignature(value: string, signature: string) {
  return safeEqual(sign(value), signature);
}

