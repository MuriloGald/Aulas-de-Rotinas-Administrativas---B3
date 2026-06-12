/**
 * SC Fire — Tipos TypeScript do banco de dados Supabase
 * Gerado a partir do schema em supabase/migrations/001_initial_schema.sql
 */

export type Level = "Bronze" | "Prata" | "Ouro";
export type Category = "Primeiros Socorros" | "Combate a Incêndio" | "SIPAT";
export type ClassStatus = "agendada" | "em_andamento" | "concluida" | "cancelada";
export type CompanyType = "Indústria" | "Escola" | "Outros";
export type ComboType = "basica" | "intermediaria" | "avancada" | "lei-lucas" | "customizado";
export type AttendanceSource = "csv" | "qr_code" | "manual";

export interface Subtheme {
  id: string;
  name: string;
  category: Category;
  level: Level;
  hours: number;
  price: number;
  canva_embed: string | null;
  pdf_url: string | null;
  description: string | null;
  syllabus: string | null;
  in28_code: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  total_hours: number;
  combo_type: ComboType | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingSubtheme {
  id: string;
  training_id: string;
  subtheme_id: string;
  sort_order: number;
  is_mandatory: boolean;
  created_at: string;
  subtheme?: Subtheme;
}

export interface Class {
  id: string;
  company_id: string;
  training_id: string;
  instructor_id: string | null;
  status: ClassStatus;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  location: string | null;
  notes: string | null;
  qr_code_token: string;
  created_at: string;
  updated_at: string;
  // Joins
  company?: Company;
  training?: Training;
}

export interface Student {
  id: string;
  company_id: string | null;
  full_name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  source: AttendanceSource;
  checked_in_at: string | null;
  latitude: number | null;
  longitude: number | null;
  instructor_approved: boolean;
  created_at: string;
  student?: Student;
}

export interface ExamQuestion {
  id: string;
  subtheme_id: string;
  question_text: string;
  options: { text: string; correct: boolean }[];
  explanation: string | null;
  active: boolean;
  created_at: string;
}

export interface ExamResult {
  id: string;
  class_id: string;
  student_id: string;
  subtheme_id: string | null;
  score: number;
  passed: boolean;
  answers: Record<string, string> | null;
  completed_at: string;
}

/** Tipo de retorno de queries com join para exibição */
export interface ClassWithDetails extends Class {
  company: Company;
  training: Training;
  student_count?: number;
}

export interface CourseCombo {
  id: string;
  key: string;
  label: string;
  price: number;
  hours: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComboSubtheme {
  id: string;
  combo_id: string;
  subtheme_id: string;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  subtheme_id: string;
  text: string;
  options: QuestionOption[];
  explanation?: string;
}
