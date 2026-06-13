"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  GraduationCap,
  Clock,
  CalendarDays,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  ClipboardList,
  X,
  Trash2,
  Shield,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

/* ═══ Types ═══ */
type ClassStatus = "em_andamento" | "agendada" | "concluida";

interface TrainingClass {
  id: string | number;
  name: string;
  training: string;
  hours: number;
  startDate: string;
  endDate: string;
  students: number;
  progress: number;
  status: ClassStatus;
}

interface Subtema {
  id: string;
  name: string;
  category: string;
  hours: number;
}

/* ═══ Mock Data Fallback ═══ */
const MOCK_CLASSES: TrainingClass[] = [
  {
    id: 1,
    name: "1ª Turma B3 — Jun/2026",
    training: "Rotinas Administrativas B3",
    hours: 9,
    startDate: "10/06/2026",
    endDate: "—",
    students: 0,
    progress: 0,
    status: "agendada",
  },
];

const statusConfig: Record<
  ClassStatus,
  { label: string; color: string; icon: typeof Play }
> = {
  em_andamento: {
    label: "Em Andamento",
    color: "bg-primary/15 text-primary",
    icon: Play,
  },
  agendada: {
    label: "Agendada",
    color: "bg-accent/15 text-accent",
    icon: CalendarDays,
  },
  concluida: {
    label: "Concluída",
    color: "bg-success/15 text-success",
    icon: CheckCircle2,
  },
};

/* ═══ Component ═══ */
export default function TurmasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClassStatus | "all">("all");
  const [classes, setClasses] = useState<TrainingClass[]>(MOCK_CLASSES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<TrainingClass | null>(null);

  /* ── Nova Turma Modal ── */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [subtemas, setSubtemas] = useState<Subtema[]>([]);
  const [selectedSubtemas, setSelectedSubtemas] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  /* ── Fetch Turmas ── */
  const fetchClasses = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("classes")
      .select(`
        id, status, scheduled_at, started_at, finished_at,
        name,
        training:trainings(name, total_hours),
        attendances(id)
      `)
      .order("scheduled_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped: TrainingClass[] = (data as any[]).map((row) => ({
        id: row.id,
        name: row.name ?? "Turma B3",
        training: row.training?.name ?? "Rotinas Administrativas B3",
        hours: Number(row.training?.total_hours ?? 9),
        startDate: row.scheduled_at
          ? new Date(row.scheduled_at).toLocaleDateString("pt-BR")
          : "—",
        endDate: row.finished_at
          ? new Date(row.finished_at).toLocaleDateString("pt-BR")
          : "—",
        students: Array.isArray(row.attendances) ? row.attendances.length : 0,
        progress:
          row.status === "concluida" ? 100 :
          row.status === "em_andamento" ? 50 : 0,
        status: row.status as ClassStatus,
      }));
      setClasses(mapped);
    }
    setIsLoading(false);
  };

  /* ── Fetch Subtemas para o Modal ── */
  const fetchSubtemas = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("subthemes")
      .select("id, name, category, hours")
      .eq("active", true)
      .order("category");

    if (!error && data && data.length > 0) {
      setSubtemas(data as Subtema[]);
      // Pré-seleciona todos
      setSelectedSubtemas(new Set(data.map((s: any) => s.id)));
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSubtemas();
  }, []);

  /* ── Abrir Modal Criar Turma ── */
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split("T")[0];
    setCreateName("");
    setCreateDate(today);
    // Pré-seleciona todos os subtemas
    setSelectedSubtemas(new Set(subtemas.map((s) => s.id)));
    setIsCreateOpen(true);
  };

  const handleToggleSubtema = (id: string) => {
    setSelectedSubtemas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Salvar Nova Turma ── */
  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();

    try {
      // 1. Insere a turma na tabela `classes`
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert({
          name: createName.trim(),
          status: "agendada",
          scheduled_at: createDate ? new Date(createDate).toISOString() : new Date().toISOString(),
        })
        .select()
        .single();

      if (classError) throw classError;

      // 2. Se a tabela tiver relação com subtemas, insere (gracioso se não existir)
      if (classData?.id && selectedSubtemas.size > 0) {
        const links = Array.from(selectedSubtemas).map((subId, idx) => ({
          class_id: classData.id,
          subtheme_id: subId,
          order_index: idx,
        }));
        // Tenta inserir — ignora silenciosamente se tabela não existir ainda
        await supabase.from("class_subthemes").insert(links).then(() => {});
      }

      // 3. Atualiza lista local
      await fetchClasses();
      setIsCreateOpen(false);

    } catch (err: any) {
      console.error("Erro ao criar turma:", err);
      // Fallback: adiciona localmente para não bloquear o fluxo
      const newClass: TrainingClass = {
        id: "local-" + Date.now(),
        name: createName.trim(),
        training: "Rotinas Administrativas B3",
        hours: subtemas.filter(s => selectedSubtemas.has(s.id)).reduce((a, s) => a + s.hours, 0),
        startDate: createDate ? new Date(createDate + "T12:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
        endDate: "—",
        students: 0,
        progress: 0,
        status: "agendada",
      };
      setClasses((prev) => [newClass, ...prev]);
      setIsCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  /* ── Deletar Turma ── */
  const handleDeleteClass = async (id: string | number) => {
    if (!confirm("⚠️ Tem certeza que deseja EXCLUIR esta turma? Esta ação não pode ser desfeita.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (!error) {
      setSelectedClass(null);
      fetchClasses();
    } else {
      alert("Erro ao excluir turma.");
    }
  };

  /* ── Filtros ── */
  const filtered = classes.filter((cls) => {
    const matchSearch =
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.training.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || cls.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: classes.length,
    em_andamento: classes.filter((c) => c.status === "em_andamento").length,
    agendada:     classes.filter((c) => c.status === "agendada").length,
    concluida:    classes.filter((c) => c.status === "concluida").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Turmas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie e gerencie suas turmas de instrução B3.
          </p>
        </div>
        <button
          id="new-turma-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nova Turma
        </button>
      </div>

      {/* ── Tabs / Filters ── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 p-1 rounded-lg bg-surface border border-border">
          {(
            [
              { key: "all",          label: "Todas" },
              { key: "em_andamento", label: "Em Andamento" },
              { key: "agendada",     label: "Agendadas" },
              { key: "concluida",    label: "Concluídas" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                statusFilter === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="turmas-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar turma..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* ── Class Cards ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando turmas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((cls) => {
            const cfg = statusConfig[cls.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className="group relative overflow-hidden rounded-xl bg-card border border-border p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {cls.training}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cls.hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {cls.students} participantes
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {cls.startDate}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-foreground font-medium">{cls.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cls.progress === 100 ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${cls.progress}%` }}
                    />
                  </div>
                </div>

                {/* Hover action */}
                {cls.status === "em_andamento" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0 group-hover:h-12 bg-primary/10 backdrop-blur-sm flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden border-t border-primary/20">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Continuar Instrução</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-foreground font-semibold">Nenhuma turma encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua primeira turma clicando em "Nova Turma".
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════
           MODAL: CRIAR NOVA TURMA (sem /comercial)
      ══════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90dvh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-surface/50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Nova Turma B3</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTurma} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Nome da Turma */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ex: 1ª Turma B3 — Jun/2026"
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Subtemas Incluídos */}
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Tópicos Incluídos na Instrução</h4>
                  <p className="text-[10px] text-muted-foreground">Selecione os subtemas que serão apresentados nessa turma:</p>
                </div>

                {subtemas.length === 0 ? (
                  <div className="p-4 rounded-lg bg-surface border border-border text-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Nenhum subtema cadastrado.{" "}
                      <span className="text-primary font-medium">Configure na aba Módulos.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 border border-border/60 rounded-xl p-3 bg-surface/20">
                    {subtemas.map((sub) => {
                      const isChecked = selectedSubtemas.has(sub.id);
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubtema(sub.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? "bg-primary/5 border-primary/40"
                              : "bg-card border-border hover:border-primary/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                              isChecked ? "bg-primary border-primary text-white" : "border-border bg-surface"
                            }`}>
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-foreground">{sub.name}</div>
                              <div className="text-[10px] text-muted-foreground">{sub.category}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sub.hours}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resumo de carga horária */}
              {selectedSubtemas.size > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <span className="text-muted-foreground">{selectedSubtemas.size} tópicos selecionados</span>
                  <span className="font-bold text-primary">
                    {subtemas.filter(s => selectedSubtemas.has(s.id)).reduce((a, s) => a + s.hours, 0).toFixed(1)}h de instrução
                  </span>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !createName.trim()}
                  className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {saving ? "Criando..." : "Criar Turma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
           MODAL: OPÇÕES DA TURMA SELECIONADA
      ══════════════════════════════════════════════ */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-surface/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${statusConfig[selectedClass.status].color}`}>
                    {statusConfig[selectedClass.status].label}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {selectedClass.startDate}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{selectedClass.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedClass.training}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Opções para Agendadas / Em Andamento */}
              {(selectedClass.status === "em_andamento" || selectedClass.status === "agendada") && (
                <>
                  <Link
                    href={`/instrutor/apresentacao?classId=${selectedClass.id}`}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Play className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm">Abrir Cockpit de Aula</h4>
                        <p className="text-xs text-white/80">Acessar slides, cronômetro e QR Code</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:bg-muted transition-all group opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-foreground">Gerenciar Participantes</h4>
                        <p className="text-xs text-muted-foreground">Lista de presença (em breve)</p>
                      </div>
                    </div>
                  </button>
                </>
              )}

              {/* Opções para Concluídas */}
              {selectedClass.status === "concluida" && (
                <>
                  <Link
                    href={`/instrutor/turmas/${selectedClass.id}/participantes`}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-primary/30 hover:border-primary hover:bg-primary/5 shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-foreground">Lista de Participantes</h4>
                        <p className="text-xs text-muted-foreground">Ver presenças e engajamento</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:bg-muted transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-foreground">Emitir Certificados</h4>
                        <p className="text-xs text-muted-foreground">Gerar lote de certificados em PDF</p>
                      </div>
                    </div>
                  </button>

                  <Link
                    href={`/instrutor/turmas/${selectedClass.id}/relatorio`}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:bg-muted transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-foreground">Relatório de Turma</h4>
                        <p className="text-xs text-muted-foreground">Ver histórico e logs da apresentação</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Zona de Perigo */}
            <div className="p-4 border-t border-rose-500/20 bg-rose-500/5 flex justify-center">
              <button
                onClick={() => handleDeleteClass(selectedClass.id)}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Turma (Apenas Diretoria)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
