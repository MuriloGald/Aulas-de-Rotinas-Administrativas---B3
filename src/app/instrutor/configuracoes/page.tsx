"use client";

import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  Globe,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";

const sections = [
  {
    title: "Perfil",
    icon: User,
    description: "Nome, e-mail e foto do instrutor",
    items: [
      { label: "Nome", value: "Murilo" },
      { label: "E-mail", value: "murilo@scfire.com.br" },
      { label: "Cargo", value: "Instrutor Principal" },
    ],
  },
  {
    title: "Notificações",
    icon: Bell,
    description: "Alertas de turmas e avaliações",
    items: [
      { label: "Novas turmas agendadas", value: "Ativado" },
      { label: "Alunos aprovados", value: "Ativado" },
      { label: "Alertas de reciclagem", value: "Ativado" },
    ],
  },
  {
    title: "Integrações",
    icon: Globe,
    description: "Conexões com sistemas externos",
    items: [
      { label: "Canva", value: "Conectado ✓" },
      { label: "Sistema de Certificados", value: "Webhook ativo" },
      { label: "Supabase", value: "Conectado ✓" },
    ],
  },
  {
    title: "Segurança",
    icon: Shield,
    description: "Senha e autenticação",
    items: [
      { label: "Autenticação", value: "E-mail + Senha" },
      { label: "Última alteração de senha", value: "12/05/2026" },
    ],
  },
];

export default function ConfiguracoesPage() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie seu perfil, integrações e preferências.
        </p>
      </div>

      {/* Theme Toggle Card */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Aparência
              </h3>
              <p className="text-xs text-muted-foreground">
                Alternar entre modo claro e escuro
              </p>
            </div>
          </div>
          <button
            id="theme-toggle"
            onClick={toggleDarkMode}
            className="relative w-14 h-7 rounded-full bg-surface border border-border transition-colors duration-300 hover:border-primary/40"
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                darkMode
                  ? "left-[calc(100%-1.625rem)] bg-primary"
                  : "left-0.5 bg-muted-foreground"
              }`}
            >
              {darkMode ? (
                <Moon className="w-3 h-3 text-white" />
              ) : (
                <Sun className="w-3 h-3 text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Setting Sections */}
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl bg-card border border-border overflow-hidden"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
              <section.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {section.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors cursor-pointer group"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.value}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
