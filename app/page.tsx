import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { isValidSessionValue, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const authenticated = isValidSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  return <AppShell initialAuthenticated={authenticated} />;
}

