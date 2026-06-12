import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth Callback Route Handler
 * Supabase redireciona para cá após confirmação de e-mail ou OAuth.
 * Troca o code PKCE por uma sessão válida.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/instrutor/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redireciona para login com erro
  return NextResponse.redirect(`${origin}/?error=auth_callback`);
}
