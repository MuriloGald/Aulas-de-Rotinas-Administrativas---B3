"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  MapPin,
  FileText,
  Building,
  UserPlus,
  Loader2,
  Phone,
  Mail,
  Briefcase,
  ChevronRight,
} from "lucide-react";

/* ═══ Helper: Formata CPF ═══ */
function formatCPF(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function validateCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  return true;
}

function StudentCheckInForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  /* ═══ States ═══ */
  const [loadingClass, setLoadingClass] = useState(true);
  const [activeClass, setActiveClass] = useState<any>(null);
  const [classError, setClassError] = useState<string | null>(null);

  // Form states
  const [step, setStep] = useState<"cpf" | "register" | "geolocate" | "success">("cpf");
  const [cpf, setCpf] = useState("");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  // Registration states (new student)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Location states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  // Submission details
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  /* ═══ Fetch Class Info from Token ═══ */
  useEffect(() => {
    async function loadClass() {
      if (!token) {
        setClassError("Nenhum código de turma fornecido. Escaneie o QR Code exibido pelo instrutor.");
        setLoadingClass(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("classes")
          .select(`
            id, status, scheduled_at,
            company:companies(id, name, type),
            training:trainings(id, name, total_hours)
          `)
          .eq("qr_code_token", token)
          .single();

        if (error || !data) {
          setClassError("QR Code inválido ou expirado. Peça ao instrutor para abrir um novo QR Code.");
        } else if (data.status === "concluida") {
          setClassError("Este treinamento já foi encerrado pelo instrutor.");
        } else if (data.status === "agendada") {
          setClassError("Esta aula ainda não foi iniciada pelo instrutor. Aguarde na sala de aula.");
        } else {
          setActiveClass(data);
        }
      } catch (err) {
        console.error("Erro ao carregar turma:", err);
        setClassError("Erro de comunicação com o servidor. Tente novamente.");
      } finally {
        setLoadingClass(false);
      }
    }

    loadClass();
  }, [token, supabase]);

  /* ═══ Step 1: Verificar CPF ═══ */
  const handleCpfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      setFormError("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Procurar o aluno pelo CPF
        const { data: student, error } = await supabase
          .from("students")
          .select("*")
          .eq("cpf", cleanCpf)
          .maybeSingle();

        if (error) throw error;

        if (student) {
          // Aluno já existe! Verificar se já registrou presença nesta aula
          const { data: attendance, error: attError } = await supabase
            .from("attendances")
            .select("*")
            .eq("class_id", activeClass.id)
            .eq("student_id", student.id)
            .maybeSingle();

          if (attError) throw attError;

          if (attendance) {
            // Presença já registrada! Pular para o final feliz
            setStudentInfo(student);
            setAttendanceRecord(attendance);
            setStep("success");
          } else {
            // Aluno existe, mas ainda não tem presença nesta aula.
            if (!student.company_id && activeClass.company?.id) {
              await supabase
                .from("students")
                .update({ company_id: activeClass.company.id })
                .eq("id", student.id);
              student.company_id = activeClass.company.id;
            }

            setStudentInfo(student);
            requestLocation(student.id, false);
          }
        } else {
          setStep("register");
        }
      } catch (err: any) {
        console.error("Erro ao verificar CPF:", err);
        setFormError("Erro ao verificar cadastro. Tente novamente.");
      }
    });
  };

  /* ═══ Step 2: Cadastrar Novo Aluno ═══ */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fullName.trim().length < 3) {
      setFormError("Por favor, preencha seu nome completo.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    startTransition(async () => {
      try {
        const { data: newStudent, error: stError } = await supabase
          .from("students")
          .insert({
            cpf: cleanCpf,
            full_name: fullName.trim(),
            email: email.trim() || null,
            phone: phone.replace(/\D/g, "") || null,
            role: role.trim() || null,
            company_id: activeClass.company?.id || null,
          })
          .select()
          .single();

        if (stError) throw stError;

        setStudentInfo(newStudent);
        requestLocation(newStudent.id, true);
      } catch (err: any) {
        console.error("Erro ao cadastrar aluno:", err);
        setFormError("Erro ao realizar cadastro. Verifique os dados ou tente novamente.");
      }
    });
  };

  /* ═══ Step 3: Solicitar Geolocalização & Confirmar Presença ═══ */
  const requestLocation = (studentId: string, isNewUser: boolean) => {
    setStep("geolocate");
    setGeolocating(true);
    setFormError(null);

    if (!navigator.geolocation) {
      console.warn("Geolocalização não suportada pelo navegador.");
      registerAttendance(studentId, null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setGeolocating(false);
        registerAttendance(studentId, lat, lon);
      },
      (error) => {
        console.warn("Permissão de geolocalização negada ou falhou:", error.message);
        setLocationDenied(true);
        setGeolocating(false);
        registerAttendance(studentId, null, null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const registerAttendance = async (studentId: string, lat: number | null, lon: number | null) => {
    try {
      const { data, error } = await supabase
        .from("attendances")
        .insert({
          class_id: activeClass.id,
          student_id: studentId,
          source: "qr_code",
          latitude: lat,
          longitude: lon,
          instructor_approved: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: existingAtt } = await supabase
            .from("attendances")
            .select("*")
            .eq("class_id", activeClass.id)
            .eq("student_id", studentId)
            .single();
          setAttendanceRecord(existingAtt);
        } else {
          throw error;
        }
      } else {
        setAttendanceRecord(data);
      }

      setStep("success");
    } catch (err: any) {
      console.error("Erro ao registrar presença:", err);
      setFormError("Sua presença não pôde ser gravada. Informe ao instrutor.");
    }
  };

  /* ═══ loading view ═══ */
  if (loadingClass) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Carregando informações da turma...
          </p>
        </div>
      </div>
    );
  }

  /* ═══ error view ═══ */
  if (classError) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-destructive/5 blur-[80px]" />
        
        <div className="relative z-10 w-full max-w-md glass border border-destructive/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/25 flex items-center justify-center mx-auto text-destructive animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Check-in Indisponível</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {classError}
            </p>
          </div>

          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Corpo de Bombeiros Militar de Santa Catarina
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-background relative overflow-hidden px-6 py-8">
      <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[350px] h-[350px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-md shadow-primary/5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-lg text-foreground tracking-tight">CBMSC</span>
      </header>

      <main className="relative z-10 w-full max-w-md mx-auto my-auto">
        <div className="glass rounded-2xl border border-border/60 shadow-2xl overflow-hidden shadow-black/30">
          <div className="bg-surface/50 border-b border-border/40 px-6 py-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Instrução Presencial B3</span>
              <h2 className="text-sm font-bold text-foreground truncate">{activeClass.training?.name}</h2>
              <p className="text-[11px] text-muted-foreground truncate">{activeClass.company?.name}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {formError && (
              <div className="flex items-start gap-2.5 px-4 py-3 mb-5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-slide-up">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: CPF INPUT */}
            {step === "cpf" && (
              <form onSubmit={handleCpfSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">Identifique-se</h3>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                    Digite seu CPF para consultar seu cadastro na base militar e registrar sua presença.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="student-cpf" className="text-xs font-semibold text-foreground">
                    CPF
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      id="student-cpf"
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm font-semibold tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-ring/45 focus:border-primary hover:border-muted-foreground/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 rounded-xl bg-fire-gradient-strong text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continuar</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: REGISTER NEW STUDENT */}
            {step === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Primeiro Acesso</h3>
                  <p className="text-xs text-muted-foreground">
                    Não encontramos um cadastro com o CPF <span className="font-mono text-foreground font-semibold">{cpf}</span>. Preencha seus dados para criar sua ficha de aluno.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-name" className="text-xs font-semibold text-foreground">
                    Nome Completo <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="new-name"
                      type="text"
                      placeholder="Ex: João da Silva"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring/45 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-role" className="text-xs font-semibold text-foreground">
                    Cargo / Função <span className="text-muted-foreground">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      id="new-role"
                      type="text"
                      placeholder="Ex: Operador de Máquina"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring/45 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-phone" className="text-xs font-semibold text-foreground">
                      Celular <span className="text-muted-foreground">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="new-phone"
                        type="tel"
                        placeholder="(48) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring/45 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="new-email" className="text-xs font-semibold text-foreground">
                      E-mail <span className="text-muted-foreground">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="new-email"
                        type="email"
                        placeholder="nome@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring/45 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("cpf")}
                    className="flex-1 h-11 rounded-xl bg-surface border border-border text-muted-foreground font-semibold text-sm hover:text-foreground transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-[2] h-11 rounded-xl bg-fire-gradient-strong text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Criar Ficha</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: GEOLOCATE AND RECORD PRESENCE */}
            {step === "geolocate" && (
              <div className="text-center space-y-6 py-4 animate-pulse">
                <div className="relative inline-flex mx-auto">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-8 h-8 animate-bounce" />
                  </div>
                  <span className="absolute -inset-1 rounded-full border border-primary/20 animate-ping opacity-75" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Confirmando Localização</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Estamos coletando a geolocalização do seu celular para auditar a sua presença presencial nesta aula e emitir o seu certificado homologado.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-primary font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando credenciais...</span>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS VIEW */}
            {step === "success" && (
              <div className="text-center space-y-6 py-2">
                <div className="relative inline-flex mx-auto animate-float">
                  <div className="w-16 h-16 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center text-success shadow-lg shadow-success/15">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="absolute -inset-2 bg-success rounded-full opacity-5 blur-lg" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Presença Registrada!</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Parabéns, <span className="font-semibold text-foreground">{studentInfo?.full_name}</span>. Sua participação no treinamento está confirmada.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-success/5 border border-success/15 text-left space-y-2.5 max-w-sm mx-auto">
                  <div className="flex items-center gap-2 text-success font-bold text-xs pb-1.5 border-b border-success/10">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Presença Homologada</span>
                  </div>
                  
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>CPF:</span>
                      <span className="font-mono text-foreground font-semibold">
                        ***.***.{studentInfo?.cpf?.slice(6, 9)}-{studentInfo?.cpf?.slice(9, 11)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Empresa:</span>
                      <span className="text-foreground font-semibold truncate max-w-[200px]">
                        {activeClass.company?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span className="text-foreground font-semibold">
                        {attendanceRecord?.checked_in_at 
                          ? new Date(attendanceRecord.checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auditoria GPS:</span>
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        {attendanceRecord?.latitude && attendanceRecord?.longitude ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            Coordenadas Ativas
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            GPS Offline (Padrão)
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                    Presença confirmada! Para visualizar os slides da aula, material de apoio e responder aos quizzes em tempo real, acesse o portal abaixo:
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    href={`/aluno/portal?classId=${activeClass.id}&studentId=${studentInfo?.id}`}
                    className="inline-flex items-center gap-2 h-11 px-6 w-full rounded-xl bg-fire-gradient-strong text-white font-bold text-xs shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all justify-center"
                  >
                    <span>Acessar Portal do Aluno</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-[10px] text-muted-foreground mt-8">
        © {new Date().getFullYear()} Corpo de Bombeiros Militar de Santa Catarina.
        <br />
        Desenvolvido com foco em conformidade B3 e eficiência administrativa.
      </footer>
    </div>
  );
}

export default function StudentCheckInPage() {
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
      <StudentCheckInForm />
    </Suspense>
  );
}
