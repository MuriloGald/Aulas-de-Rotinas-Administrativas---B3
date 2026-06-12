"use client";

import { useState, useTransition } from "react";
import {
  Flame,
  Shield,
  LogIn,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Users,
  BookOpen,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-float" />
        <div
          className="absolute bottom-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-primary/3 blur-[140px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/2 blur-[100px] animate-float"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-16">

        {/* ── Left: Branding ── */}
        <div className="flex-1 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Instrução Militar
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center shadow-lg border border-border overflow-hidden">
              <img src="/logo-cbmsc.png" alt="CBMSC Logo" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-foreground">
                CBMSC
              </h1>
              <p className="text-sm font-bold text-primary tracking-wider uppercase mt-1">
                Rotinas Administrativas B3
              </p>
            </div>
          </div>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Plataforma oficial de instrução de <strong className="text-foreground">Rotinas Administrativas (Módulo B3)</strong>.
            Apoio pedagógico para praças e oficiais do Corpo de Bombeiros Militar de Santa Catarina.
          </p>

          <div className="space-y-3">
            {[
              {
                icon: Zap,
                title: "Apresentação Integrada",
                desc: "Material didático projetado diretamente no sistema",
              },
              {
                icon: Users,
                title: "Check-in de Instrução",
                desc: "Presença digital georreferenciada para as turmas",
              },
              {
                icon: BookOpen,
                title: "Banco de Questões",
                desc: "Avaliações com feedback automático para os instruendos",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-surface cursor-default"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Login Card ── */}
        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/20 animate-pulse-glow">
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shadow-lg border border-border overflow-hidden">
                <img src="/logo-cbmsc-dark.png" alt="CBMSC Shield" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Acessar Plataforma
                </h2>
                <p className="text-sm text-muted-foreground">
                  Entre com suas credenciais do CBMSC
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 mb-5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form action={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-foreground"
                >
                  E-mail Funcional
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="instrutor@cbm.sc.gov.br"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-4 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary hover:border-muted-foreground/40"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary-hover transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 px-4 pr-11 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary hover:border-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={isPending}
                className="group relative w-full h-12 rounded-lg bg-primary text-white font-semibold text-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Entrar
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-muted-foreground bg-card">
                  Acesso de Instruendos
                </span>
              </div>
            </div>

            {/* QR Code Access */}
            <button
              id="qr-access"
              type="button"
              className="group w-full flex items-center justify-between h-11 px-4 rounded-lg border border-border bg-surface text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-muted-foreground/30"
            >
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-primary"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <path d="M18 14h3v3" />
                  <path d="M14 18h3v3" />
                  <path d="M18 18h3v3" />
                </svg>
                Entrar com QR Code
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} CBMSC - Corpo de Bombeiros Militar de Santa Catarina.
            <br />
            Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
