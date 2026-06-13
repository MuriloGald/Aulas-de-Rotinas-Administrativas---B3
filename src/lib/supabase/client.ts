import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components ("use client").
 * Usa cookies gerenciados pelo @supabase/ssr para manter a sessão
 * sincronizada entre cliente e servidor.
 *
 * IMPORTANTE: As variáveis NEXT_PUBLIC_SUPABASE_URL e
 * NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas no painel
 * da Vercel (Settings → Environment Variables) para o app funcionar.
 *
 * Durante build/SSR sem essas variáveis, retorna null para evitar
 * falha na compilação. O app não funcionará sem elas em produção.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Sem env vars (ex: durante build na Vercel sem configuração),
  // retorna null para não lançar exceção e quebrar o build.
  if (!url || !key) return null as any;

  return createBrowserClient(url, key);
}
