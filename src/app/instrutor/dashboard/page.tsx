"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Shield,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  Plus,
  CalendarDays,
  Award,
  ArrowUpRight,
  GraduationCap,
  Lock,
  UserCheck,
  Eye,
  Boxes,
  Megaphone,
  AlertTriangle,
  Flame,
} from "lucide-react";

/* ═══ Types ═══ */
type SectionStatus = "active" | "construction";

interface Section {
  id: string;
  code: string;
  name: string;
  title: string;
  desc: string;
  icon: any;
  status: SectionStatus;
}

/* ═══ Estado-Maior Sections Configuration ═══ */
const SECTIONS: Section[] = [
  {
    id: "s1",
    code: "S1",
    name: "1ª Seção",
    title: "Pessoal & Administração",
    desc: "Gestão de pessoal militar, escalas de serviço, folhas e condutas.",
    icon: UserCheck,
    status: "construction",
  },
  {
    id: "s2",
    code: "S2",
    name: "2ª Seção",
    title: "Inteligência & Segurança",
    desc: "Segurança de dados orgânicos, diretrizes de inteligência e segurança física.",
    icon: Eye,
    status: "construction",
  },
  {
    id: "s3",
    code: "S3",
    name: "3ª Seção",
    title: "Instrução, Ensino e Operações",
    desc: "Doutrina de instrução militar, turmas de rotinas administrativas B3 e cockpit de aulas.",
    icon: GraduationCap,
    status: "active",
  },
  {
    id: "s4",
    code: "S4",
    name: "4ª Seção",
    title: "Logística & Almoxarifado",
    desc: "Controle de patrimônio, fardamento, suprimentos e frota de viaturas.",
    icon: Boxes,
    status: "construction",
  },
  {
    id: "s5",
    code: "S5",
    name: "5ª Seção",
    title: "Comunicação & R.P.",
    desc: "Relações públicas, comunicação social corporativa e eventos institucionais.",
    icon: Megaphone,
    status: "construction",
  },
];

/* ═══ Mock Data Fallbacks ═══ */
const upcomingClasses = [
  {
    id: 1,
    dbId: "mock-1",
    company: "DAT — Dir. de Atividades Técnicas",
    training: "Rotinas Administrativas B3",
    date: "15 Jun, 08:00",
    students: 24,
    progress: 50,
  },
  {
    id: 2,
    dbId: "mock-2",
    company: "1º Batalhão — Florianópolis",
    training: "Redação Militar & Protocolo",
    date: "18 Jun, 14:00",
    students: 35,
    progress: 0,
  },
  {
    id: 3,
    dbId: "mock-3",
    company: "3º Batalhão — Blumenau",
    training: "Gestão e Processos SIGAD",
    date: "22 Jun, 07:30",
    students: 18,
    progress: 25,
  },
];

const recentSubthemes = [
  { name: "Coordenação de Bombeiros Comunitários — Parâmetros Gerais", level: "Bronze", hours: "2h" },
  { name: "Ficha de Apuração de Conduta", level: "Bronze", hours: "1.5h" },
  { name: "Escalas de Serviço", level: "Bronze", hours: "1.5h" },
  { name: "Treinamentos Operacionais", level: "Prata", hours: "2h" },
  { name: "Gestão de Pessoal", level: "Prata", hours: "2h" },
];

const levelColors: Record<string, string> = {
  Bronze: "bg-amber-800/20 text-amber-500",
  Prata: "bg-slate-400/20 text-slate-300",
  Ouro: "bg-yellow-500/20 text-yellow-400",
};

export default function DashboardPage() {
  const supabase = createClient();
  const [activeClasses, setActiveClasses] = useState(7);
  const [subthemeCount, setSubthemeCount] = useState(5);
  const [upcomingClassesData, setUpcomingClassesData] = useState<any[]>(upcomingClasses);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("s3");

  useEffect(() => {
    async function loadStats() {
      try {
        const [classesRes, subthemesRes, nextClassesRes] = await Promise.all([
          supabase
            .from("classes")
            .select("id", { count: "exact", head: true })
            .in("status", ["agendada", "em_andamento"]),
          supabase
            .from("subthemes")
            .select("id", { count: "exact", head: true })
            .eq("active", true),
          supabase
            .from("classes")
            .select(`
              id, scheduled_at, status,
              company:companies(name),
              training:trainings(name, total_hours)
            `)
            .in("status", ["agendada", "em_andamento"])
            .order("scheduled_at", { ascending: true })
            .limit(3),
        ]);

        if (!classesRes.error && classesRes.count !== null) setActiveClasses(classesRes.count);
        if (!subthemesRes.error && subthemesRes.count !== null) setSubthemeCount(subthemesRes.count);

        if (!nextClassesRes.error && nextClassesRes.data && nextClassesRes.data.length > 0) {
          const mapped = (nextClassesRes.data as any[]).map((row, i) => ({
            id: i + 1,
            dbId: row.id,
            company: row.company?.name ?? "Batalhão",
            training: row.training?.name ?? "Instrução B3",
            date: row.scheduled_at
              ? new Date(row.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
              : "A definir",
            students: 0,
            progress: row.status === "em_andamento" ? 50 : 0,
          }));
          setUpcomingClassesData(mapped);
        }
      } catch (err) {
        console.warn("Banco de dados não configurado ou tabelas ausentes, utilizando dados de demonstração.", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [supabase]);

  const dynamicStats = [
    { label: "Instruções Ativas", value: String(activeClasses), change: "agendadas e em andamento", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/instrutor/turmas" },
    { label: "Módulos de Rotina", value: String(subthemeCount), change: "Rotinas Administrativas B3", icon: BookOpen, color: "text-accent", bg: "bg-accent/10", href: "/instrutor/subtemas" },
    { label: "Horas Ministradas", value: "48h", change: "+12h este mês", icon: Clock, color: "text-success", bg: "bg-success/10", href: "#" },
    { label: "Aproveitamento Médio", value: "94%", change: "+3% vs anterior", icon: TrendingUp, color: "text-warning", bg: "bg-warning/10", href: "#" },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Estado-Maior CBMSC 🛡️
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão estratégica integrada inspirada no modelo do Exército Brasileiro.
          </p>
        </div>
      </div>

      {/* ── Seções Estado-Maior Grid Selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SECTIONS.map((section) => {
          const IconComponent = section.icon;
          const isActive = selectedSection === section.id;
          const isConstruction = section.status === "construction";

          return (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`relative flex flex-col p-4 rounded-xl border text-left transition-all duration-300 ${
                isActive
                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 scale-[1.02] z-10"
                  : "bg-card border-border hover:border-muted-foreground/30 hover:bg-surface/50"
              }`}
            >
              {/* Badge superior */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  isConstruction 
                    ? "bg-muted text-muted-foreground/80" 
                    : "bg-primary/20 text-primary border border-primary/30"
                }`}>
                  {section.code}
                </span>

                {isConstruction ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>

              {/* Ícone e Nome */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-primary/20" : "bg-surface"}`}>
                  <IconComponent className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                  {section.name}
                </span>
              </div>

              {/* Título */}
              <h3 className="text-xs font-bold text-foreground truncate leading-tight w-full">
                {section.title}
              </h3>

              {/* Descrição curta */}
              <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {section.desc}
              </p>

              {/* Status de Seleção */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Conteúdo Condicional da Seção Selecionada ── */}
      {selectedSection === "s3" ? (
        <div className="space-y-6 animate-fade-in">
          {/* Alerta de Seção Ativa */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <Flame className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-primary">3ª Seção (S3) — Espaço de Instrução Ativo</h4>
              <p className="text-[11px] text-muted-foreground/90 mt-0.5 leading-relaxed">
                Você está no espaço de <strong>Instrução, Ensino e Operações</strong>. Esta seção está integrada com o banco de dados do Supabase e dá suporte completo para as aulas da matéria de <strong>Rotinas Administrativas B3</strong>.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {dynamicStats.map((stat, i) => {
              const CardTag = stat.href && stat.href !== "#" ? Link : "div";
              return (
                <CardTag
                  key={stat.label}
                  href={stat.href as string}
                  className={`group relative overflow-hidden rounded-xl bg-card border border-border p-5 transition-all duration-300 block ${stat.href !== "#" ? "cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" : ""}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    {stat.href !== "#" && (
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
                    </div>
                    {stat.label === "Módulos de Rotina" && (
                      <div className="flex gap-1.5 mb-1" title="Níveis: Bronze, Prata e Ouro">
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                        <span className="w-2 h-2 rounded-full bg-slate-400 ring-2 ring-slate-400/20" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400 ring-2 ring-yellow-400/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </CardTag>
              );
            })}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Próximas Turmas */}
            <div className="xl:col-span-2 rounded-xl bg-card border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Próximas Instruções</h2>
                </div>
                <Link href="/instrutor/turmas" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium flex items-center gap-1">
                  Ver todas
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {upcomingClassesData.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/instrutor/apresentacao?classId=${cls.dbId}`}
                    className="group flex items-center gap-4 px-5 py-4 hover:bg-surface/50 transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Play className="w-4 h-4 text-primary ml-0.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{cls.company}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{cls.training}</p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-foreground font-medium">{cls.date}</span>
                      <span className="text-[11px] text-muted-foreground">{cls.students} alunos</span>
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 w-24">
                      <span className="text-[11px] text-muted-foreground">{cls.progress}%</span>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${cls.progress}%` }} />
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Subtemas Recentes */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-foreground">Tópicos Administrativos B3</h2>
                </div>
                <Link href="/instrutor/subtemas" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium flex items-center gap-1">
                  Ver todos
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {recentSubthemes.map((sub) => (
                  <div key={sub.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm text-foreground font-medium truncate group-hover:text-primary transition-colors">{sub.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{sub.hours} de instrução</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${levelColors[sub.level] || "bg-muted text-muted-foreground"}`}>
                      {sub.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Iniciar Instrução B3", desc: "Abrir o Hub de Apresentação", color: "text-primary", border: "hover:border-primary/30", href: "/instrutor/apresentacao" },
              { icon: Award, title: "Módulos de Curso", desc: "Visualizar e estruturar os combos", color: "text-accent", border: "hover:border-accent/30", href: "/instrutor/cursos" },
              { icon: Users, title: "Gerenciar Alunos", desc: "Controle de presenças e turmas", color: "text-success", border: "hover:border-success/30", href: "/instrutor/turmas" },
            ].map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-md text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* ── Tela de Seção em Construção ── */
        <div className="glass-strong rounded-2xl border border-border p-10 text-center space-y-6 animate-scale-in max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          {/* Detalhe de fundo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-muted/10 rounded-full blur-2xl pointer-events-none" />

          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-border text-muted-foreground/60 shadow-inner">
            {(() => {
              const Icon = SECTIONS.find((s) => s.id === selectedSection)?.icon || Lock;
              return <Icon className="w-10 h-10" />;
            })()}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white border border-background shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Área sob Planejamento Estratégico
            </span>
            <h2 className="text-xl font-extrabold text-foreground">
              {SECTIONS.find((s) => s.id === selectedSection)?.title}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              O módulo correspondente à{" "}
              <strong>{SECTIONS.find((s) => s.id === selectedSection)?.name}</strong> está atualmente em fase de modelagem de requisitos pela Diretoria de Ensino e Instrução do CBMSC.
            </p>
          </div>

          {/* Conteúdo específico por seção */}
          <div className="p-4 rounded-xl bg-surface border border-border text-left space-y-3 max-w-md mx-auto text-xs">
            <span className="font-bold text-foreground block border-b border-border pb-1.5">
              Escopo Futuro da Seção:
            </span>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              {selectedSection === "s1" && (
                <>
                  <li>Sincronização de fichas cadastrais com o SIGRH do CBMSC.</li>
                  <li>Módulo automatizado de geração de Escala de Serviço Diário.</li>
                  <li>Relatórios consolidados de Ficha de Apuração de Conduta (FAC).</li>
                </>
              )}
              {selectedSection === "s2" && (
                <>
                  <li>Canal seguro de salvaguarda de documentos sensíveis.</li>
                  <li>Avaliações periódicas de segurança orgânica de quartéis.</li>
                  <li>Auditorias de acessos e diretrizes de contrainformação.</li>
                </>
              )}
              {selectedSection === "s4" && (
                <>
                  <li>Inventário digital integrado com leitor de código de barras.</li>
                  <li>Controle de abastecimento, manutenção e rota de viaturas.</li>
                  <li>Cautela eletrônica de equipamentos de proteção individual (EPI).</li>
                </>
              )}
              {selectedSection === "s5" && (
                <>
                  <li>Agendamento e controle de visitas de escolas aos quartéis.</li>
                  <li>Repositório de mídias, logos oficiais e notas à imprensa.</li>
                  <li>Mural digital de aniversariantes e promoções internas.</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/60">
            <button
              onClick={() => setSelectedSection("s3")}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              Ir para 3ª Seção (S3) Ativa
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
