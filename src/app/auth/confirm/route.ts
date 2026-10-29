import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const token_hash = req.nextUrl.searchParams.get("token_hash");
  const type = req.nextUrl.searchParams.get("type");
  if (token_hash && (type === "email" || type === "recovery")) {
    const client = await db();
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(
        new URL(type === "recovery" ? "/nova-senha" : "/", req.url),
      );
  }
  return NextResponse.redirect(new URL("/entrar?error=link", req.url));
}
