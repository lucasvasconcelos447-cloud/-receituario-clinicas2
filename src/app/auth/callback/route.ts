import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next =
    req.nextUrl.searchParams.get("next") === "/nova-senha"
      ? "/nova-senha"
      : "/";
  if (code) {
    const client = await db();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.redirect(new URL("/entrar?error=link", req.url));
}
