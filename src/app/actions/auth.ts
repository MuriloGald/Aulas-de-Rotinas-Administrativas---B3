"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action — Login com e-mail e senha.
 * Usa Supabase Auth. Erros são retornados como mensagens legíveis.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Traduz os erros mais comuns para pt-BR
    const messages: Record<string, string> = {
      "Invalid login credentials": "E-mail ou senha incorretos.",
      "Email not confirmed": "Confirme seu e-mail antes de entrar.",
      "Too many requests": "Muitas tentativas. Aguarde alguns minutos.",
    };
    return {
      error: messages[error.message] ?? `Erro do Supabase: ${error.message}`,
    };
  }

  redirect("/instrutor/dashboard");
}

/**
 * Server Action — Logout.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Server Action — Solicitar redefinição de senha.
 */
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) {
    return { error: "Não foi possível enviar o e-mail. Verifique o endereço." };
  }

  return { success: "E-mail de redefinição enviado! Verifique sua caixa de entrada." };
}
