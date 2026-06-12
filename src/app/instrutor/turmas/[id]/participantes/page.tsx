"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, FileCheck, Search, Filter, Plus, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ClassWithDetails } from "@/lib/supabase/types";

type StudentDisplay = {
  id: string;
  name: string;
  role: string;
  checkedIn: boolean;
  time: string | null;
  score: number | null;
};

// Mock Data para alunos quando não há no banco (apresentação bonita)
const MOCK_STUDENTS: StudentDisplay[] = [
  { id: "1", name: "Carlos Eduardo Silva", role: "Técnico de Segurança", checkedIn: true, time: "08:14", score: 9.5 },
  { id: "2", name: "Ana Beatriz Costa", role: "Líder de Produção", checkedIn: true, time: "08:20", score: 8.0 },
  { id: "3", name: "Marcos Vinicius Santos", role: "Operador de Empilhadeira", checkedIn: true, time: "08:25", score: 10.0 },
  { id: "4", name: "Juliana Mendes", role: "Auxiliar Administrativo", checkedIn: false, time: null, score: null },
  { id: "5", name: "Roberto Alves", role: "Manutenção Mecânica", checkedIn: true, time: "08:40", score: 7.5 },
];

export default function ParticipantesPage({ params }: { params: { id: string } }) {
  const [activeClass, setActiveClass] = useState<ClassWithDetails | null>(null);
  const [students, setStudents] = useState<StudentDisplay[]>(MOCK_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Busca dados básicos da turma e presenças
    const fetchData = async () => {
      const supabase = createClient();
      
      // 1. Busca os detalhes da Turma
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          *,
          company:companies(*),
          training:trainings(*)
        `)
        .eq("id", params.id)
        .single();

      if (classData && !classError) {
        setActiveClass(classData as unknown as ClassWithDetails);
      }
      
      // 2. Busca os alunos presentes (attendances + students)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendances")
        .select(`
          *,
          student:students(*)
        `)
        .eq("class_id", params.id);
        
      if (attendanceData && !attendanceError && attendanceData.length > 0) {
        const formattedStudents = attendanceData.map((att: any) => ({
          id: att.student.id,
          name: att.student.full_name,
          role: att.student.role || "Participante",
          checkedIn: true,
          time: new Date(att.checked_in_at || att.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          score: null // Será carregado do exam_results futuramente
        }));
        
        setStudents(formattedStudents);
      } else {
        // Se a turma estiver vazia (sem check-ins) exibe lista vazia, ou mantem MOCK_STUDENTS apenas para turmas específicas se desejar. Mas vamos usar lista vazia se não for a turma mockada.
        setStudents([]);
      }

      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));
  const totalPresent = students.filter(s => s.checkedIn).length;

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center text-primary animate-pulse">Carregando lista...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/instrutor/turmas" 
              className="p-2 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-primary bg-primary/10 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Participantes
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeClass?.company?.name || "Empresa Não Encontrada"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeClass?.training?.name || "Treinamento Não Informado"} • {activeClass?.scheduled_at || "Data Não Definida"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/instrutor/turmas/${params.id}/relatorio`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-surface border border-primary/30 text-primary text-sm font-semibold transition-all hover:bg-primary hover:text-white"
          >
            <FileCheck className="w-4 h-4" />
            Gerar Relatório PDF
          </Link>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Inscritos</p>
            <p className="text-2xl font-bold text-foreground">{students.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted-foreground border border-border">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Presentes (Check-in)</p>
            <p className="text-2xl font-bold text-success">{totalPresent}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Taxa de Presença</p>
            <p className="text-2xl font-bold text-primary">{Math.round((totalPresent / students.length) * 100)}%</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-surface border border-border text-sm font-medium hover:border-primary/30 transition-all">
            <FileSpreadsheet className="w-4 h-4 text-success" />
            Importar CSV
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover shadow-md shadow-primary/20 transition-all">
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Nome do Participante</th>
                <th className="px-6 py-4">Cargo / Função</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Avaliação Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {student.role}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {student.checkedIn ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Presente ({student.time})
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border">
                          <XCircle className="w-3.5 h-3.5" />
                          Ausente
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {student.score !== null ? (
                        <span className={`px-2 py-1 rounded-md font-bold text-sm ${student.score >= 7 ? 'text-success bg-success/10' : 'text-rose-500 bg-rose-500/10'}`}>
                          {student.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    Nenhum participante encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
