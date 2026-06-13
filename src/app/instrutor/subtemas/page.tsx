"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Subtheme as DBSubtheme } from "@/lib/supabase/types";
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  Filter,
  Presentation,
  FileText,
  ShieldPlus,
  Siren,
  Layers,
  X,
  Trash2,
} from "lucide-react";

/* ═══ Types ═══ */
type Level = "Bronze" | "Prata" | "Ouro";
type Category = "Coordenação" | "Gestão de Pessoal" | "Outros";

interface Subtema {
  id: number | string;
  name: string;
  level: Level;
  hours: number;
  category: Category;
  hasCanva: boolean;
  hasPDF: boolean;
  description?: string;
  syllabus?: string;
  canva_embed?: string;
  pdf_url?: string;
}

/** Converte registro do Supabase para o formato local */
function fromDB(row: DBSubtheme): Subtema {
  // Mapeia categorias do banco para o tipo local
  const catMap: Record<string, Category> = {
    "Coordenação":       "Coordenação",
    "Gestão de Pessoal": "Gestão de Pessoal",
  };
  return {
    id: row.id,
    name: row.name,
    level: row.level as Level,
    hours: Number(row.hours),
    category: (catMap[row.category] ?? "Outros") as Category,
    hasCanva: !!row.canva_embed,
    hasPDF: !!row.pdf_url,
    description: row.description || "",
    syllabus: row.syllabus || "",
    canva_embed: row.canva_embed || "",
    pdf_url: row.pdf_url || "",
  };
}

/* ═══ Helper: Sanitize Canva Presentation Link for Iframe Embedding ═══ */
function cleanCanvaUrl(url: string | null): string {
  if (!url) return "";
  
  let target = url.trim();

  // 1. Se colou a tag <iframe> inteira, extrai o src
  if (target.toLowerCase().includes("<iframe")) {
    const match = target.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      target = match[1];
    }
  }

  // 2. Se for link do Canva, garante formato de embed (?embed)
  if (target.includes("canva.com/")) {
    const baseUrl = target.split("?")[0];
    if (baseUrl.endsWith("/view") || baseUrl.endsWith("/watch")) {
      return `${baseUrl}?embed`;
    } else if (baseUrl.match(/\/design\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/) || baseUrl.match(/\/design\/[a-zA-Z0-9_-]+$/)) {
      return `${baseUrl}/view?embed`;
    }
    return `${baseUrl}?embed`;
  }

  return target;
}

/* ═══ Mock Data (fallback — substituído pelos dados reais do Supabase) ═══ */
const MOCK_SUBTEMAS: Subtema[] = [
  // Coordenação
  { id: "b3-coord",   name: "Coordenação de Bombeiros Comunitários — Parâmetros Gerais", level: "Bronze", hours: 2.0, category: "Coordenação",       hasCanva: false, hasPDF: false },

  // Gestão de Pessoal
  { id: "b3-ficha",   name: "Ficha de Apuração de Conduta",  level: "Bronze", hours: 1.5, category: "Gestão de Pessoal", hasCanva: false, hasPDF: false },
  { id: "b3-escala",  name: "Escalas de Serviço",           level: "Bronze", hours: 1.5, category: "Gestão de Pessoal", hasCanva: false, hasPDF: false },
  { id: "b3-treino",  name: "Treinamentos Operacionais",    level: "Prata",  hours: 2.0, category: "Gestão de Pessoal", hasCanva: false, hasPDF: false },
  { id: "b3-gestao",  name: "Gestão de Pessoal",           level: "Prata",  hours: 2.0, category: "Gestão de Pessoal", hasCanva: false, hasPDF: false },
];

/* ═══ Design Tokens ═══ */
const levelConfig: Record<Level, { badge: string; dot: string; label: string }> = {
  Bronze: {
    badge: "bg-amber-800/20 text-amber-500 border border-amber-700/30",
    dot: "bg-amber-500",
    label: "Teórico",
  },
  Prata: {
    badge: "bg-slate-400/20 text-slate-300 border border-slate-500/30",
    dot: "bg-slate-400",
    label: "Teórico + Prático",
  },
  Ouro: {
    badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    dot: "bg-yellow-400",
    label: "Prático Intensivo",
  },
};

const categoryConfig: Record<Category, { color: string; icon: any }> = {
  "Coordenação":       { color: "text-primary",    icon: ShieldPlus },
  "Gestão de Pessoal": { color: "text-sky-400",    icon: Layers },
  "Outros":            { color: "text-orange-400", icon: FileText },
};

const categories: Category[] = ["Coordenação", "Gestão de Pessoal", "Outros"];
const levels: Level[] = ["Bronze", "Prata", "Ouro"];

/* ═══ Component ═══ */
export default function SubtemasPage() {
  const [subtemas, setSubtemas] = useState<Subtema[]>(() =>
    MOCK_SUBTEMAS.map((s) => ({
      ...s,
      description: s.description || `Diretrizes de instrução para o tema ${s.name} no nível ${s.level}.`,
      syllabus: s.syllabus || `1. Introdução conceitual ao tema ${s.name};\n2. Análise de conformidade técnica e requisitos;\n3. Práticas aplicadas e exercícios práticos dinâmicos.`,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterLevel, setFilterLevel] = useState<Level | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados de Edição
  const [editingSubtheme, setEditingSubtheme] = useState<Subtema | null>(null);
  const [editName, setEditName] = useState("");
  const [editHours, setEditHours] = useState(1);
  const [editCategory, setEditCategory] = useState<Category>("Redação Oficial");
  const [editLevel, setEditLevel] = useState<Level>("Bronze");
  const [editDescription, setEditDescription] = useState("");
  const [editSyllabus, setEditSyllabus] = useState("");
  const [editCanvaEmbed, setEditCanvaEmbed] = useState("");
  const [editPdfUrl, setEditPdfUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Estados para Criar Novo Subtema
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createHours, setCreateHours] = useState(1);
  const [createCategory, setCreateCategory] = useState<Category>("Gestão de Pessoal");
  const [createLevel, setCreateLevel] = useState<Level>("Bronze");
  const [createDescription, setCreateDescription] = useState("");
  const [createSyllabus, setCreateSyllabus] = useState("");
  const [createCanvaEmbed, setCreateCanvaEmbed] = useState("");
  const [createPdfUrl, setCreatePdfUrl] = useState("");

  const handleOpenCreate = () => {
    setCreateName("");
    setCreateHours(1);
    setCreateCategory("Gestão de Pessoal");
    setCreateLevel("Bronze");
    setCreateDescription("");
    setCreateSyllabus("");
    setCreateCanvaEmbed("");
    setCreatePdfUrl("");
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    let newSubtheme: Subtema | null = null;

    try {
      const { data, error } = await supabase
        .from("subthemes")
        .insert({
          name: createName.trim(),
          category: createCategory,
          level: createLevel,
          hours: Number(createHours),
          description: createDescription.trim(),
          syllabus: createSyllabus.trim(),
          canva_embed: cleanCanvaUrl(createCanvaEmbed) || null,
          pdf_url: createPdfUrl.trim() || null,
          active: true,
        })
        .select()
        .single();

      if (!error && data) {
        newSubtheme = fromDB(data as DBSubtheme);
      } else {
        if (error) console.error("Erro ao criar subtema no Supabase:", error);
      }
    } catch (err) {
      console.error("Erro ao criar subtema:", err);
    }

    if (!newSubtheme) {
      newSubtheme = {
        id: "local-" + Date.now(),
        name: createName.trim(),
        category: createCategory,
        level: createLevel,
        hours: Number(createHours),
        description: createDescription.trim(),
        syllabus: createSyllabus.trim(),
        hasCanva: !!createCanvaEmbed.trim(),
        hasPDF: !!createPdfUrl.trim(),
        canva_embed: cleanCanvaUrl(createCanvaEmbed),
        pdf_url: createPdfUrl.trim(),
      };
    }

    setSubtemas((prev) => [newSubtheme!, ...prev]);
    setIsCreateOpen(false);
    setSaving(false);
  };

  const handleOpenEdit = (sub: Subtema) => {
    setEditingSubtheme(sub);
    setEditName(sub.name);
    setEditHours(sub.hours);
    setEditCategory(sub.category);
    setEditLevel(sub.level);
    setEditDescription(sub.description || `Diretrizes de instrução para o tema ${sub.name} no nível ${sub.level}.`);
    setEditSyllabus(sub.syllabus || `1. Introdução conceitual ao tema ${sub.name};\n2. Análise de conformidade técnica e requisitos;\n3. Práticas aplicadas e exercícios práticos dinâmicos.`);
    setEditCanvaEmbed(sub.canva_embed || "");
    setEditPdfUrl(sub.pdf_url || "");
  };

  const handleDelete = async () => {
    if (!editingSubtheme) return;
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este subtema?");
    if (!confirmDelete) return;

    setSaving(true);
    const supabase = createClient();
    
    if (typeof editingSubtheme.id === "string" && editingSubtheme.id.length > 10) {
      const { error } = await supabase
        .from("subthemes")
        .update({ active: false })
        .eq("id", editingSubtheme.id);
        
      if (error) {
        console.error("Erro ao deletar subtema:", error);
      }
    }

    setSubtemas((prev) => prev.filter(s => s.id !== editingSubtheme.id));
    setEditingSubtheme(null);
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtheme) return;
    setSaving(true);
    
    const supabase = createClient();
    
    // 1. Tenta atualizar no Supabase se for UUID
    if (typeof editingSubtheme.id === "string" && editingSubtheme.id.length > 10) {
      const { error } = await supabase
        .from("subthemes")
        .update({
          name: editName.trim(),
          hours: Number(editHours),
          category: editCategory,
          level: editLevel,
          description: editDescription.trim(),
          syllabus: editSyllabus.trim(),
          canva_embed: cleanCanvaUrl(editCanvaEmbed) || null,
          pdf_url: editPdfUrl.trim() || null,
        })
        .eq("id", editingSubtheme.id);
        
      if (error) {
        console.error("Erro ao salvar subtema no Supabase:", error);
      }
    }
    
    // 2. Atualiza no estado local
    setSubtemas((prev) =>
      prev.map((s) =>
        s.id === editingSubtheme.id
          ? {
              ...s,
              name: editName.trim(),
              hours: Number(editHours),
              category: editCategory,
              level: editLevel,
              description: editDescription.trim(),
              syllabus: editSyllabus.trim(),
              hasCanva: !!editCanvaEmbed.trim(),
              hasPDF: !!editPdfUrl.trim(),
              canva_embed: cleanCanvaUrl(editCanvaEmbed),
              pdf_url: editPdfUrl.trim(),
            }
          : s
       )
    );
    
    setEditingSubtheme(null);
    setSaving(false);
  };

  // Busca dados reais do Supabase; se falhar, mantém o mock
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("subthemes")
      .select("*")
      .order("category")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setSubtemas((data as DBSubtheme[]).map(fromDB));
        }
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return subtemas.filter((s) => {
      const matchesSearch =
        search === "" ||
        s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        filterCategory === "" || s.category === filterCategory;
      const matchesLevel =
        filterLevel === "" || s.level === filterLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [subtemas, search, filterCategory, filterLevel]);

  const activeFiltersCount =
    (filterCategory ? 1 : 0) + (filterLevel ? 1 : 0);

  const totalHours = filtered.reduce((acc, s) => acc + s.hours, 0);

  function clearFilters() {
    setFilterCategory("");
    setFilterLevel("");
    setSearch("");
  }

  return (
    <div className="space-y-6 animate-fade-in text-foreground bg-background">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Módulos e Tópicos
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Blocos de conteúdo modulares de Rotinas Administrativas B3.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Novo Módulo
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: filtered.length, suffix: "módulos", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "Carga Horária", value: totalHours, suffix: "horas de instrução", icon: Clock, color: "text-accent", bg: "bg-accent/10" },
          { label: "Categorias", value: new Set(filtered.map((s) => s.category)).size, suffix: "ativas", icon: Layers, color: "text-success", bg: "bg-success/10" },
          { label: "Níveis", value: new Set(filtered.map((s) => s.level)).size, suffix: "distintos", icon: Siren, color: "text-warning", bg: "bg-warning/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 transition-all duration-300 hover:border-primary/20"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-foreground leading-tight">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground truncate">{stat.suffix}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
              showFilters || activeFiltersCount > 0
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-card border border-border animate-slide-up">
            {/* Category Filter */}
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const cfg = categoryConfig[cat];
                  const active = filterCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(active ? "" : cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary/15 text-primary border border-primary/40 shadow-sm"
                          : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                      }`}
                    >
                      <cfg.icon className={`w-3 h-3 ${active ? "text-primary" : cfg.color}`} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Filter */}
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nível
              </label>
              <div className="flex flex-wrap gap-2">
                {levels.map((lvl) => {
                  const cfg = levelConfig[lvl];
                  const active = filterLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setFilterLevel(active ? "" : lvl)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary/15 text-primary border border-primary/40 shadow-sm"
                          : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {lvl}
                      <span className="text-[10px] opacity-60">({cfg.label})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear */}
            {activeFiltersCount > 0 && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Exibindo <span className="text-foreground font-semibold">{filtered.length}</span> de{" "}
          <span className="text-foreground font-semibold">{subtemas.length}</span> módulos
          {loading && <span className="ml-2 text-primary animate-pulse">· sincronizando...</span>}
        </span>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-primary hover:text-primary-hover transition-colors font-medium"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* ── Cards Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sub, i) => {
            const lvl = levelConfig[sub.level];
            const cat = categoryConfig[sub.category];
            return (
              <div
                key={sub.id}
                onClick={() => handleOpenEdit(sub)}
                className="group relative overflow-hidden rounded-xl bg-card border border-border p-5 transition-all duration-300 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Top Row: Level Badge + Hours */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${lvl.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                      {sub.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {sub.hours}h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors leading-snug">
                  {sub.name}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground/80 mb-4 line-clamp-2 h-8 leading-snug">
                  {sub.description || lvl.label}
                </p>

                {/* Category Tag */}
                <div className="flex items-center gap-1.5 mb-4">
                  <cat.icon className={`w-3 h-3 ${cat.color}`} />
                  <span className={`text-[11px] font-medium ${cat.color}`}>
                    {sub.category}
                  </span>
                </div>

                {/* Bottom: Linked content badges */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  {sub.hasCanva && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                      <Presentation className="w-3 h-3" />
                      Apresentação
                    </span>
                  )}
                  {sub.hasPDF && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-medium">
                      <FileText className="w-3 h-3" />
                      Manual
                    </span>
                  )}
                  {!sub.hasCanva && !sub.hasPDF && (
                    <span className="text-[10px] text-muted-foreground italic">
                      Sem material associado
                    </span>
                  )}
                </div>

                <div className="pt-3 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/instrutor/subtemas/${sub.id}/questoes`;
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-muted hover:text-primary transition-colors text-xs font-semibold text-muted-foreground relative z-10"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Banco de Questões
                  </button>
                </div>

                {/* Hover glow overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nenhum módulo encontrado
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Tente ajustar os filtros ou a busca.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </button>
        </div>
      )}

      {/* ═══ MODAL: Editar Subtema do Catálogo ═══ */}
      {editingSubtheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Editar Módulo de Instrução</h3>
              </div>
              <button
                onClick={() => setEditingSubtheme(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nome do Módulo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  required
                />
              </div>

              {/* Category & Level (Selects) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Category)}
                    className="w-full h-10 px-2 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="Coordenação">Coordenação</option>
                    <option value="Gestão de Pessoal">Gestão de Pessoal</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nível</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value as Level)}
                    className="w-full h-10 px-2 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Prata">Prata</option>
                    <option value="Ouro">Ouro</option>
                  </select>
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Carga Horária (horas)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editHours}
                  onChange={(e) => setEditHours(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  required
                />
              </div>

              {/* Descrição Simples */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Descrição Simples (resumo para o card)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Tópicos principais de redação de ofícios."
                  className="w-full h-16 p-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  required
                />
              </div>

              {/* Ementa Detalhada */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Conteúdo Programático</label>
                <textarea
                  value={editSyllabus}
                  onChange={(e) => setEditSyllabus(e.target.value)}
                  placeholder="Tópicos detalhados (um por linha)..."
                  className="w-full h-24 p-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-y"
                  required
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Link Apresentação Canva</label>
                  <input
                    type="url"
                    value={editCanvaEmbed}
                    onChange={(e) => setEditCanvaEmbed(e.target.value)}
                    placeholder="https://www.canva.com/..."
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Link PDF do Manual</label>
                  <input
                    type="url"
                    value={editPdfUrl}
                    onChange={(e) => setEditPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
 
              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-11 px-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-colors flex items-center justify-center"
                  title="Excluir módulo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSubtheme(null)}
                  className="flex-1 h-11 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Criar Novo Subtema ═══ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Novo Módulo de Instrução</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nome do Módulo</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ex: Elaboração de Ofícios..."
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  required
                />
              </div>

              {/* Category & Level (Selects) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Categoria</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as Category)}
                    className="w-full h-10 px-2 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="Redação Oficial">Redação Oficial</option>
                    <option value="Processos & Sistemas">Processos & Sistemas</option>
                    <option value="Legislação & Normas">Legislação & Normas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nível</label>
                  <select
                    value={createLevel}
                    onChange={(e) => setCreateLevel(e.target.value as Level)}
                    className="w-full h-10 px-2 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Prata">Prata</option>
                    <option value="Ouro">Ouro</option>
                  </select>
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Carga Horária (horas)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={createHours}
                  onChange={(e) => setCreateHours(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Descrição Simples</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Ex: Estudo prático de trâmites..."
                  className="w-full h-16 p-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  required
                />
              </div>

              {/* Ementa */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Conteúdo Programático</label>
                <textarea
                  value={createSyllabus}
                  onChange={(e) => setCreateSyllabus(e.target.value)}
                  placeholder="Tópicos (um por linha)..."
                  className="w-full h-24 p-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-y"
                  required
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Link Apresentação Canva</label>
                  <input
                    type="url"
                    value={createCanvaEmbed}
                    onChange={(e) => setCreateCanvaEmbed(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Link PDF do Manual</label>
                  <input
                    type="url"
                    value={createPdfUrl}
                    onChange={(e) => setCreatePdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {saving ? "Salvando..." : "Criar Módulo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
