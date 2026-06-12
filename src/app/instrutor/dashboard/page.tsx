import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";

/* ═══ Mock Data (será substituído por Supabase) ═══ */
const stats = [
  {
    label: "Instruções Ativas",
    value: "7",
    change: "+2 este mês",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Módulos de Rotina",
    value: "12",
    change: "3 níveis",
    icon: BookOpen,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Horas Ministradas",
    value: "48h",
    change: "+12h este mês",
    icon: Clock,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Aproveitamento Médio",
    value: "94%",
    change: "+3% vs anterior",
    icon: TrendingUp,
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

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
  { name: "Redação Oficial e Memorandos", level: "Bronze", hours: "1h" },
  { name: "Uso do Sistema SIGAD", level: "Prata", hours: "2h" },
  { name: "Gestão de Almoxarifado", level: "Bronze", hours: "1.5h" },
  { name: "Processos de Licitação", level: "Ouro", hours: "3h" },
  { name: "Diretrizes de Recursos Humanos", level: "Prata", hours: "2h" },
];

const levelColors: Record<string, string> = {
  Bronze: "bg-amber-800/20 text-amber-500",
  Prata: "bg-slate-400/20 text-slate-300",
  Ouro: "bg-yellow-500/20 text-yellow-400",
};

export default async function DashboardPage() {
  // Busca métricas reais do Supabase (fallback para valores estáticos)
  let activeClasses = 7;
  let subthemeCount = 12;
  let upcomingClassesData = upcomingClasses;

  try {
    const supabase = await createClient();

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

    if (!classesRes.error && classesRes.count !== null) activeClasses = classesRes.count;
    if (!subthemesRes.error && subthemesRes.count !== null) subthemeCount = subthemesRes.count;

    if (!nextClassesRes.error && nextClassesRes.data && nextClassesRes.data.length > 0) {
      upcomingClassesData = (nextClassesRes.data as any[]).map((row, i) => ({
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
    }
  } catch {
    // Banco não configurado ainda — usa mock data
  }

  const dynamicStats = [
    { label: "Instruções Ativas", value: String(activeClasses), change: "agendadas e em andamento", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/instrutor/turmas" },
    { label: "Módulos de Rotina", value: String(subthemeCount), change: "3 níveis", icon: BookOpen, color: "text-accent", bg: "bg-accent/10", href: "/instrutor/subtemas" },
    { label: "Horas Ministradas", value: "48h", change: "+12h este mês", icon: Clock, color: "text-success", bg: "bg-success/10", href: "#" },
    { label: "Aproveitamento Médio", value: "94%", change: "+3% vs anterior", icon: TrendingUp, color: "text-warning", bg: "bg-warning/10", href: "#" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bom dia, Instrutor 🛡️
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral das instruções e turmas ativas de Rotinas Administrativas B3.
          </p>
        </div>

        <Link
          id="new-class-btn"
          href="/instrutor/turmas"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nova Turma
        </Link>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dynamicStats.map((stat, i) => {
          const CardTag = stat.href && stat.href !== "#" ? Link : "div";
          return (
            <CardTag
              key={stat.label}
              href={stat.href as string}
              className={`group relative overflow-hidden rounded-xl bg-card border border-border p-5 transition-all duration-300 block ${stat.href !== "#" ? "cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.href !== "#" && (
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </div>
                </div>
                {stat.label === "Módulos de Rotina" && (
                  <div className="flex gap-1.5 mb-1" title="Níveis: Bronze, Prata e Ouro">
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 ring-2 ring-slate-400/20" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400 ring-2 ring-yellow-400/20" />
                  </div>
                )}
              </div>
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </CardTag>
          );
        })}
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Próximas Turmas */}
        <div className="xl:col-span-2 rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Próximas Instruções
              </h2>
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
                {/* Play button */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Play className="w-4 h-4 text-primary ml-0.5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {cls.company}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {cls.training}
                  </p>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-foreground font-medium">
                    {cls.date}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {cls.students} alunos
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 w-24">
                  <span className="text-[11px] text-muted-foreground">
                    {cls.progress}%
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                       className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${cls.progress}%` }}
                    />
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
              <h2 className="text-sm font-semibold text-foreground">
                Tópicos Administrativos B3
              </h2>
            </div>
            <Link href="/instrutor/subtemas" className="text-xs text-primary hover:text-primary-hover transition-colors font-medium flex items-center gap-1">
              Ver todos
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentSubthemes.map((sub) => (
              <div
                key={sub.name}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface/50 transition-colors cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm text-foreground font-medium truncate group-hover:text-primary transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {sub.hours} de instrução
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${levelColors[sub.level]}`}
                >
                  {sub.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Shield,
            title: "Iniciar Instrução B3",
            desc: "Abrir o Hub de Apresentação",
            color: "text-primary",
            border: "hover:border-primary/30",
            href: "/instrutor/apresentacao",
          },
          {
            icon: Award,
            title: "Módulos de Curso",
            desc: "Visualizar e estruturar os combos",
            color: "text-accent",
            border: "hover:border-accent/30",
            href: "/instrutor/cursos",
          },
          {
            icon: Users,
            title: "Gerenciar Alunos",
            desc: "Upload e controle de turmas",
            color: "text-success",
            border: "hover:border-success/30",
            href: "/instrutor/turmas",
          },
        ].map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group flex items-center gap-4 p-5 rounded-xl bg-card border border-border ${action.border} transition-all duration-300 hover:shadow-md text-left`}
          >
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center group-hover:scale-110 transition-transform">
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
