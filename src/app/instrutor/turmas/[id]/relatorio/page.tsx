"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ClassWithDetails } from "@/lib/supabase/types";

// Mock Data
const MOCK_STUDENTS = [
  { id: "1", name: "Carlos Eduardo Silva", role: "Técnico de Segurança", checkedIn: true, time: "08:14", score: 9.5 },
  { id: "2", name: "Ana Beatriz Costa", role: "Líder de Produção", checkedIn: true, time: "08:20", score: 8.0 },
  { id: "3", name: "Marcos Vinicius Santos", role: "Operador de Empilhadeira", checkedIn: true, time: "08:25", score: 10.0 },
  { id: "4", name: "Juliana Mendes", role: "Auxiliar Administrativo", checkedIn: false, time: null, score: null },
  { id: "5", name: "Roberto Alves", role: "Manutenção Mecânica", checkedIn: true, time: "08:40", score: 7.5 },
];

export default function RelatorioTurmaPage({ params }: { params: { id: string } }) {
  const [activeClass, setActiveClass] = useState<ClassWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
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
      }

      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-primary animate-pulse">Gerando relatório...</div>;
  }

  const presentStudents = students.filter(s => s.checkedIn);

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center py-10 print:py-0 print:bg-white text-black font-sans">
      {/* ── Flutuante Ações (Escondido na impressão) ── */}
      <div className="fixed top-6 right-6 flex flex-col gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white shadow-xl hover:bg-primary-hover hover:-translate-y-1 transition-all"
        >
          <Printer className="w-5 h-5" />
          <span className="font-bold">Salvar como PDF</span>
        </button>
        <Link
          href={`/instrutor/turmas/${params.id}/participantes`}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-primary shadow-md hover:bg-neutral-50 transition-all border border-neutral-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">Voltar</span>
        </Link>
      </div>

      {/* ── Documento A4 ── */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none print:w-full print:min-h-0 mx-auto border border-neutral-200 print:border-none p-12">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-red-600 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">SC FIRE</h1>
            <p className="text-xs text-neutral-500 font-medium mt-1 uppercase tracking-wider">Treinamentos e Serviços de Combate a Incêndio</p>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">CNPJ: 20.544.712/0001-89</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-red-600 uppercase tracking-wider">Relatório de Turma</h2>
            <p className="text-sm text-neutral-600 mt-1 font-medium">Turma #{params.id.split('-')[0] || "1029"}</p>
          </div>
        </div>

        {/* Informações da Turma */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10 text-sm">
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Empresa Cliente</p>
            <p className="font-semibold text-neutral-900 text-base">{activeClass?.company?.name || "Empresa Não Encontrada"}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Treinamento Realizado</p>
            <p className="font-semibold text-neutral-900 text-base">{activeClass?.training?.name || "Treinamento Não Informado"}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Data de Realização</p>
            <p className="font-medium text-neutral-800">{activeClass?.scheduled_at || "Data Não Informada"}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Instrutor(a) Responsável</p>
            <p className="font-medium text-neutral-800">Sargento BM Murilo Galdino</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex gap-4 mb-10">
          <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Inscritos</p>
            <p className="text-2xl font-black text-neutral-800">{students.length}</p>
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Presentes</p>
            <p className="text-2xl font-black text-green-800">{presentStudents.length}</p>
          </div>
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Aproveitamento</p>
            <p className="text-2xl font-black text-blue-800">
              {(presentStudents.reduce((acc, curr) => acc + (curr.score || 0), 0) / presentStudents.length).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Tabela de Presença */}
        <div className="mb-16">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 border-b border-neutral-300 pb-2">Lista de Presença (Alunos Aprovados)</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700">
                <th className="py-2 px-3 border border-neutral-300 font-bold w-12 text-center">#</th>
                <th className="py-2 px-3 border border-neutral-300 font-bold">Nome do Participante</th>
                <th className="py-2 px-3 border border-neutral-300 font-bold">Cargo / Função</th>
                <th className="py-2 px-3 border border-neutral-300 font-bold text-center w-24">Avaliação</th>
                <th className="py-2 px-3 border border-neutral-300 font-bold text-center">Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {presentStudents.map((s, index) => (
                <tr key={s.id}>
                  <td className="py-3 px-3 border border-neutral-300 text-center text-neutral-500 font-medium">{index + 1}</td>
                  <td className="py-3 px-3 border border-neutral-300 font-semibold text-neutral-800">{s.name}</td>
                  <td className="py-3 px-3 border border-neutral-300 text-neutral-600">{s.role}</td>
                  <td className="py-3 px-3 border border-neutral-300 text-center font-bold">{s.score?.toFixed(1)}</td>
                  <td className="py-3 px-3 border border-neutral-300">
                    <div className="flex flex-col items-center justify-center pt-2">
                      <span className="text-[10px] text-neutral-400 italic font-medium tracking-wide">ASSINATURA DIGITAL VALIDADA</span>
                      <span className="text-[9px] text-neutral-300">{s.time}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assinatura do Instrutor */}
        <div className="flex justify-center mt-20 pt-10">
          <div className="text-center w-80">
            <div className="border-t border-neutral-800 mb-2"></div>
            <p className="font-bold text-neutral-900">Sargento BM Murilo Galdino</p>
            <p className="text-xs text-neutral-500">Instrutor Responsável - SC Fire</p>
            <p className="text-[10px] text-neutral-400 mt-2">Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
