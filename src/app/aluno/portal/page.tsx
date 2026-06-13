"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  ShieldCheck,
  User,
  Building,
  Loader2,
  ChevronRight,
  HelpCircle,
  FileText,
  Lock,
} from "lucide-react";

/* ═══ Types ═══ */
interface ClassInfo {
  id: string;
  status: string;
  interaction_mode: boolean;
  active_subtheme_id: string | null;
  company: {
    name: string;
  };
  training: {
    name: string;
    total_hours: number;
  };
}

interface StudentInfo {
  id: string;
  full_name: string;
  cpf: string;
}

interface Subtheme {
  id: string;
  name: string;
  category: string;
  level: string;
  hours: number;
  canva_embed: string | null;
  pdf_url: string | null;
  description: string | null;
}

interface Question {
  id: string;
  question_text: string;
  options: { text: string; correct: boolean }[];
  explanation: string | null;
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");

  /* ═══ States ═══ */
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"material" | "quiz" | "comprovante">("material");
  
  // Data
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [activeSubtheme, setActiveSubtheme] = useState<Subtheme | null>(null);
  
  // Quiz states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ═══ Initial Load ═══ */
  useEffect(() => {
    if (!classId || !studentId) {
      setErrorMsg("Identificadores inválidos. Por favor, refaça o check-in via QR Code.");
      setLoading(false);
      return;
    }

    async function loadInitialData() {
      try {
        // 1. Fetch Class
        const { data: clsData, error: clsError } = await supabase
          .from("classes")
          .select(`
            id, status, interaction_mode, active_subtheme_id,
            company:companies(name),
            training:trainings(name, total_hours)
          `)
          .eq("id", classId)
          .single();

        if (clsError || !clsData) throw new Error("Turma não encontrada.");
        setClassInfo(clsData as any);

        // 2. Fetch Student
        const { data: stdData, error: stdError } = await supabase
          .from("students")
          .select("id, full_name, cpf")
          .eq("id", studentId)
          .single();

        if (stdError || !stdData) throw new Error("Aluno não encontrado.");
        setStudentInfo(stdData);

        // 3. Load active subtheme if set
        if (clsData.active_subtheme_id) {
          fetchSubtheme(clsData.active_subtheme_id);
        }
      } catch (err: any) {
        console.error("Erro ao carregar portal:", err);
        setErrorMsg(err.message || "Erro de conexão com o banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [classId, studentId, supabase]);

  /* ═══ Fetch Subtheme Details ═══ */
  const fetchSubtheme = async (subthemeId: string) => {
    try {
      const { data, error } = await supabase
        .from("subthemes")
        .select("*")
        .eq("id", subthemeId)
        .single();

      if (!error && data) {
        setActiveSubtheme(data as any);
        // Load questions for this subtheme
        loadQuestions(subthemeId);
      }
    } catch (err) {
      console.error("Erro ao carregar subtema:", err);
    }
  };

  /* ═══ Fetch Exam Questions ═══ */
  const loadQuestions = async (subthemeId: string) => {
    setLoadingQuiz(true);
    try {
      const { data, error } = await supabase
        .from("exam_questions")
        .select("id, question_text, options, explanation")
        .eq("subtheme_id", subthemeId)
        .eq("active", true);

      if (!error && data) {
        setQuestions(data as any[]);
        
        // Reset quiz states for the new subtheme
        setSelectedOption(null);
        setQuizSubmitted(false);
        setQuizResult(null);

        // Check if student already has a result for this subtheme in this class
        const { data: existingResult } = await supabase
          .from("exam_results")
          .select("score, passed")
          .eq("class_id", classId)
          .eq("student_id", studentId)
          .eq("subtheme_id", subthemeId)
          .maybeSingle();

        if (existingResult) {
          setQuizResult(existingResult);
          setQuizSubmitted(true);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar questões:", err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  /* ═══ Real-Time Polling (every 3 seconds) ═══ */
  useEffect(() => {
    if (!classId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("status, interaction_mode, active_subtheme_id")
          .eq("id", classId)
          .single();

        if (!error && data) {
          setClassInfo((prev) => prev ? { ...prev, ...data } : null);

          // If active subtheme changed, fetch its details
          if (data.active_subtheme_id && (!activeSubtheme || activeSubtheme.id !== data.active_subtheme_id)) {
            fetchSubtheme(data.active_subtheme_id);
          }
        }
      } catch (err) {
        console.warn("Falha no polling da aula:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [classId, activeSubtheme, supabase]);

  /* ═══ Submit Quiz Answer ═══ */
  const handleSubmitAnswer = async () => {
    if (selectedOption === null || questions.length === 0 || !activeSubtheme) return;

    const isCorrect = questions[0].options[selectedOption].correct;
    const score = isCorrect ? 100 : 0;

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("exam_results")
          .insert({
            class_id: classId,
            student_id: studentId,
            subtheme_id: activeSubtheme.id,
            score,
            passed: isCorrect,
            answers: { selected_index: selectedOption },
          });

        if (error && error.code !== "23505") throw error;

        setQuizResult({ score, passed: isCorrect });
        setQuizSubmitted(true);
      } catch (err) {
        console.error("Erro ao gravar resposta:", err);
        alert("Erro ao enviar sua resposta. Tente novamente.");
      }
    });
  };

  /* ═══ Loader ═══ */
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Carregando seu portal de aluno...
          </p>
        </div>
      </div>
    );
  }

  /* ═══ Error view ═══ */
  if (errorMsg) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md glass border border-destructive/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/25 flex items-center justify-center mx-auto text-destructive">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Acesso Negado</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={() => router.push("/aluno/check-in")}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/95 transition-all"
          >
            Fazer Check-In Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-background relative overflow-hidden px-4 py-6 md:p-8">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-foreground">CBMSC PORTAL DO ALUNO</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider">AULA ATIVA</span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
        
        {/* Class Banner */}
        <div className="glass rounded-2xl border border-border/60 p-4 sm:p-5 mb-5 shadow-lg shadow-black/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">CURSO INSTITUCIONAL - B3</span>
              <h1 className="text-base font-bold text-foreground leading-snug truncate">
                {classInfo?.training.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {classInfo?.company.name} · {classInfo?.training.total_hours} horas
              </p>
            </div>
          </div>
        </div>

        {/* Sync Alert if Interaction Mode is active */}
        {classInfo?.interaction_mode && activeTab !== "quiz" && (
          <button
            onClick={() => setActiveTab("quiz")}
            className="flex items-center gap-3 px-4 py-3.5 mb-5 rounded-xl bg-accent text-white shadow-lg shadow-accent/25 animate-pulse cursor-pointer border-none text-left w-full hover:scale-[1.01] transition-transform duration-200"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider block">PROVÃO INTERATIVO LIBERADO</span>
              <span className="text-[11px] text-white/90 leading-tight block truncate">
                O instrutor liberou uma pergunta sobre "{activeSubtheme?.name || 'Slides'}". Responda agora!
              </span>
            </div>
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          </button>
        )}

        {/* Tab Navigation */}
        <div className="flex p-1 rounded-xl bg-surface border border-border mb-5 flex-shrink-0">
          <button
            onClick={() => setActiveTab("material")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "material"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Apostila Digital
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 relative ${
              activeTab === "quiz"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" />
            Ticket de Saída
            {classInfo?.interaction_mode && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("comprovante")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              activeTab === "comprovante"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Comprovante
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-h-0">
          
          {/* TAB 1: MATERIAL DE APOIO / APOSTILA PROGRESSIVA */}
          {activeTab === "material" && (
            <div className="h-full flex flex-col min-h-0 animate-fade-in">
              {activeSubtheme ? (
                <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                  {/* Subtheme info */}
                  <div className="px-5 py-4 border-b border-border bg-surface/30 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                        CONTEÚDO ATUAL
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Sincronizado com os slides do instrutor
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mt-1 truncate">
                      {activeSubtheme.name}
                    </h3>
                  </div>

                  {/* PDF or Canva embed */}
                  <div className="flex-1 min-h-0 relative bg-black">
                    {activeSubtheme.canva_embed ? (
                      <iframe
                        src={activeSubtheme.canva_embed}
                        className="w-full h-full border-none bg-black"
                        allowFullScreen
                        allow="fullscreen"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <FileText className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Apostila Digital Progressiva</h4>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                            O material de leitura referente a este subtema está disponível em formato PDF. Peça auxílio ao instrutor caso deseje abrir em outra tela.
                          </p>
                        </div>
                        {activeSubtheme.pdf_url && (
                          <a
                            href={activeSubtheme.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-surface border border-border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
                          >
                            Baixar Apostila PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass border border-border rounded-2xl shadow-xl space-y-4 min-h-[300px]">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Aguardando Apresentação</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-normal">
                      Assim que o instrutor selecionar um subtema e projetar os slides, o material correspondente aparecerá aqui automaticamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TICKET DE SAÍDA / QUIZ */}
          {activeTab === "quiz" && (
            <div className="h-full flex flex-col min-h-0 animate-fade-in space-y-4">
              {!classInfo?.interaction_mode && !quizSubmitted ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass border border-border rounded-2xl shadow-xl space-y-4 min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Ticket de Saída Bloqueado</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-normal">
                      O provão interativo é disparado pelo instrutor em momentos específicos do treinamento presencial. Aguarde o comando no telão!
                    </p>
                  </div>
                </div>
              ) : loadingQuiz ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass border border-border rounded-2xl shadow-xl space-y-4 min-h-[300px]">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-xs text-muted-foreground">Buscando questões do subtema...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 glass border border-border rounded-2xl shadow-xl space-y-4 min-h-[300px]">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Sem Questões Disponíveis</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-normal">
                      Não encontramos nenhuma pergunta cadastrada no banco de dados para o subtema ativo: **"{activeSubtheme?.name}"**.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
                  
                  {/* Top info */}
                  <div className="pb-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span>Provão Rápido: {activeSubtheme?.name}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-foreground mt-2 leading-relaxed">
                      {questions[0].question_text}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="my-6 space-y-3 flex-1 overflow-y-auto max-h-[40vh] pr-1">
                    {questions[0].options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      
                      // Feedback styling
                      let optionStyle = "border-border bg-surface hover:border-muted-foreground/30";
                      if (isSelected) optionStyle = "border-accent bg-accent/10 text-accent font-semibold";
                      
                      if (quizSubmitted) {
                        if (opt.correct) {
                          optionStyle = "border-success bg-success/15 text-success font-semibold";
                        } else if (isSelected) {
                          optionStyle = "border-destructive bg-destructive/15 text-destructive font-semibold";
                        } else {
                          optionStyle = "border-border bg-surface/50 opacity-60 pointer-events-none";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full p-4 rounded-xl border text-xs text-left transition-all duration-200 flex items-center justify-between gap-3 ${optionStyle}`}
                        >
                          <span>{opt.text}</span>
                          {!quizSubmitted && isSelected && (
                            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white text-[10px]">✓</div>
                          )}
                          {quizSubmitted && opt.correct && (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          )}
                          {quizSubmitted && isSelected && !opt.correct && (
                            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom details / Action */}
                  <div className="border-t border-border pt-4 flex-shrink-0">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null || isPending}
                        className="w-full h-11 rounded-xl bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Enviar Resposta</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-surface border border-border/80 text-left space-y-2.5 animate-slide-up">
                        <div className="flex items-center gap-2 font-bold text-xs pb-1.5 border-b border-border">
                          {quizResult?.passed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-success" />
                              <span className="text-success">Parabéns, resposta correta!</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              <span className="text-destructive">Resposta incorreta.</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          <strong className="text-foreground">Explicação:</strong> {questions[0].explanation || 'O instrutor explicará a questão logo em seguida.'}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECEIPT / CERTIFICATION COMPROVANTE */}
          {activeTab === "comprovante" && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl text-center space-y-6">
                <div className="relative inline-flex mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center text-success shadow-lg shadow-success/15 animate-float">
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="absolute -inset-2 bg-success rounded-full opacity-5 blur-lg" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Comprovante de Check-in</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
                    Ficha oficial homologada. Este registro garante a sua auditoria de presença.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border/50 text-left space-y-2.5 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-success font-bold text-xs pb-1.5 border-b border-border">
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Presença Ativa & Georreferenciada</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Nome Completo:</span>
                      <span className="text-foreground font-semibold truncate max-w-[200px]">
                        {studentInfo?.full_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPF do Aluno:</span>
                      <span className="font-mono text-foreground font-semibold">
                        ***.***.{studentInfo?.cpf?.slice(6, 9)}-{studentInfo?.cpf?.slice(9, 11)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Empresa Vinculada:</span>
                      <span className="text-foreground font-semibold truncate max-w-[200px]">
                        {classInfo?.company.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Curso / Carga Horária:</span>
                      <span className="text-foreground font-semibold">
                        {classInfo?.training.name} ({classInfo?.training.total_hours}h)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status da Ficha:</span>
                      <span className="text-success font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Homologado CBMSC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground leading-normal max-w-xs mx-auto">
                    Corpo de Bombeiros Militar de Santa Catarina
                    <br />
                    Ficha registrada sob o protocolo de segurança militar Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center text-[10px] text-muted-foreground mt-6 flex-shrink-0">
        © {new Date().getFullYear()} Corpo de Bombeiros Militar de Santa Catarina.
        <br />
        Portal do Aluno · Foco em conformidade técnica e eficiência administrativa.
      </footer>
    </div>
  );
}

export default function StudentPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Carregando portal de credenciais...
          </p>
        </div>
      </div>
    }>
      <StudentPortalContent />
    </Suspense>
  );
}
