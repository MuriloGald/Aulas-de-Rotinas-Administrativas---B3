-- ══════════════════════════════════════════════════════════════════
-- CBMSC — Script Completo: Schema + Seed B3
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New query → cole e execute
-- ══════════════════════════════════════════════════════════════════

-- ── 0. Extensões necessárias ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 0b. Remover check constraints herdados do modelo SC Fire ──
-- (Permite categorias novas do B3 em vez de 'Primeiros Socorros' / 'Combate a Incêndio' / 'SIPAT')
ALTER TABLE IF EXISTS public.subthemes
  DROP CONSTRAINT IF EXISTS subthemes_category_check;

ALTER TABLE IF EXISTS public.subthemes
  DROP CONSTRAINT IF EXISTS subthemes_level_check;

-- Remover constraints de classes que referenciam company_id e training_id obrigatórios
-- (no modelo B3, classes são simples — sem empresa ou treinamento vinculados)
ALTER TABLE IF EXISTS public.classes
  DROP CONSTRAINT IF EXISTS classes_company_id_fkey;
ALTER TABLE IF EXISTS public.classes
  DROP CONSTRAINT IF EXISTS classes_training_id_fkey;
ALTER TABLE IF EXISTS public.classes
  DROP CONSTRAINT IF EXISTS classes_status_check;

-- Tornar company_id e training_id opcionais na tabela classes (se existirem)
ALTER TABLE IF EXISTS public.classes
  ALTER COLUMN company_id  DROP NOT NULL;
ALTER TABLE IF EXISTS public.classes
  ALTER COLUMN training_id DROP NOT NULL;

-- ── 0c. Adicionar colunas novas caso a tabela já exista sem elas ──
ALTER TABLE IF EXISTS public.classes
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE IF EXISTS public.subthemes
  ADD COLUMN IF NOT EXISTS syllabus TEXT;

-- ══════════════════════════════════════════════════════════════════
-- PARTE 1: CRIAR TABELAS (caso não existam)
-- ══════════════════════════════════════════════════════════════════

-- ── Subtemas / Módulos de Instrução ──
CREATE TABLE IF NOT EXISTS public.subthemes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'Bronze',
  hours        NUMERIC(5,1) NOT NULL DEFAULT 1.0,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  description  TEXT,
  syllabus     TEXT,
  canva_embed  TEXT,
  pdf_url      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Cursos (único curso B3) ──
CREATE TABLE IF NOT EXISTS public.course_combos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          TEXT NOT NULL UNIQUE,
  label        TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  hours        NUMERIC(5,1) NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vínculo Curso ↔ Subtema (com ordem de apresentação) ──
CREATE TABLE IF NOT EXISTS public.combo_subthemes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combo_id     UUID NOT NULL REFERENCES public.course_combos(id) ON DELETE CASCADE,
  subtheme_id  UUID NOT NULL REFERENCES public.subthemes(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (combo_id, subtheme_id)
);

-- ── Turmas ──
CREATE TABLE IF NOT EXISTS public.classes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT,
  status       TEXT NOT NULL DEFAULT 'agendada',
  scheduled_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vínculo Turma ↔ Subtema ──
CREATE TABLE IF NOT EXISTS public.class_subthemes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subtheme_id  UUID NOT NULL REFERENCES public.subthemes(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (class_id, subtheme_id)
);

-- ── Presenças / Participantes ──
CREATE TABLE IF NOT EXISTS public.attendances (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name         TEXT,
  email        TEXT,
  checked_in   BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Banco de Questões ──
CREATE TABLE IF NOT EXISTS public.questions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subtheme_id  UUID REFERENCES public.subthemes(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  options      JSONB,
  answer       TEXT,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- PARTE 2: RLS — Row Level Security
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.subthemes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_combos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_subthemes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subthemes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions        ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (para check-in de alunos sem login)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subthemes' AND policyname = 'Subtemas - leitura publica') THEN
    CREATE POLICY "Subtemas - leitura publica"   ON public.subthemes       FOR SELECT TO anon, authenticated USING (active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Classes - leitura publica') THEN
    CREATE POLICY "Classes - leitura publica"     ON public.classes         FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendances' AND policyname = 'Attendances - acesso publico') THEN
    CREATE POLICY "Attendances - acesso publico"  ON public.attendances     FOR ALL    TO anon, authenticated USING (true);
  END IF;
END $$;

-- Políticas para acesso autenticado (instrutor)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subthemes' AND policyname = 'Subtemas - acesso autenticado') THEN
    CREATE POLICY "Subtemas - acesso autenticado"       ON public.subthemes       FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_combos' AND policyname = 'Combos - acesso autenticado') THEN
    CREATE POLICY "Combos - acesso autenticado"         ON public.course_combos   FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combo_subthemes' AND policyname = 'Combo subthemes - acesso autenticado') THEN
    CREATE POLICY "Combo subthemes - acesso autenticado" ON public.combo_subthemes FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Classes - acesso autenticado') THEN
    CREATE POLICY "Classes - acesso autenticado"        ON public.classes         FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'class_subthemes' AND policyname = 'Class subthemes - acesso autenticado') THEN
    CREATE POLICY "Class subthemes - acesso autenticado" ON public.class_subthemes FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Questions - acesso autenticado') THEN
    CREATE POLICY "Questions - acesso autenticado"      ON public.questions       FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- PARTE 3: SEED — Dados Iniciais B3
-- ══════════════════════════════════════════════════════════════════

-- Limpar dados antigos (seguro — tabelas foram criadas acima)
TRUNCATE TABLE public.combo_subthemes CASCADE;
TRUNCATE TABLE public.course_combos    CASCADE;
TRUNCATE TABLE public.subthemes        CASCADE;

-- ── Subtemas reais do B3 ──
INSERT INTO public.subthemes (name, category, level, hours, active) VALUES
  ('Coordenação de Bombeiros Comunitários — Parâmetros Gerais', 'Coordenação',       'Bronze', 2.0, true),
  ('Ficha de Apuração de Conduta',                              'Gestão de Pessoal', 'Bronze', 1.5, true),
  ('Escalas de Serviço',                                        'Gestão de Pessoal', 'Bronze', 1.5, true),
  ('Treinamentos Operacionais',                                 'Gestão de Pessoal', 'Prata',  2.0, true),
  ('Gestão de Pessoal',                                         'Gestão de Pessoal', 'Prata',  2.0, true)
ON CONFLICT DO NOTHING;

-- ── Curso único B3 ──
INSERT INTO public.course_combos (key, label, price, hours, active) VALUES
  ('rotinas-b3', 'Rotinas Administrativas B3', 0.00, 9.0, true)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label, hours = EXCLUDED.hours, active = EXCLUDED.active;

-- ── Vínculos subtemas → curso (com ordem de apresentação) ──
DO $$
DECLARE
  v_combo_id   UUID;
  v_sub_id     UUID;
  v_order      INTEGER := 1;
  v_sub_name   TEXT;
BEGIN
  SELECT id INTO v_combo_id FROM public.course_combos WHERE key = 'rotinas-b3';

  FOREACH v_sub_name IN ARRAY ARRAY[
    'Coordenação de Bombeiros Comunitários — Parâmetros Gerais',
    'Ficha de Apuração de Conduta',
    'Escalas de Serviço',
    'Treinamentos Operacionais',
    'Gestão de Pessoal'
  ]
  LOOP
    SELECT id INTO v_sub_id FROM public.subthemes WHERE name = v_sub_name LIMIT 1;

    IF v_sub_id IS NOT NULL THEN
      INSERT INTO public.combo_subthemes (combo_id, subtheme_id, order_index)
      VALUES (v_combo_id, v_sub_id, v_order)
      ON CONFLICT (combo_id, subtheme_id) DO UPDATE SET order_index = EXCLUDED.order_index;
      v_order := v_order + 1;
    END IF;
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- ✅ Verificação Final
-- ══════════════════════════════════════════════════════════════════
SELECT 'subthemes' AS tabela, count(*) AS registros FROM public.subthemes
UNION ALL
SELECT 'course_combos', count(*) FROM public.course_combos
UNION ALL
SELECT 'combo_subthemes', count(*) FROM public.combo_subthemes;
