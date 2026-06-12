-- ══════════════════════════════════════════════════════════════════
-- SC FIRE — Migração 005: Tabelas de Combos/Cursos Administrativos
-- Execute este script no Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → cole e execute)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Criar Tabela de Combos de Cursos ──
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

-- ── 2. Criar Tabela Relacional de Matérias dos Combos ──
CREATE TABLE IF NOT EXISTS public.combo_subthemes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combo_id     UUID NOT NULL REFERENCES public.course_combos(id) ON DELETE CASCADE,
  subtheme_id  UUID NOT NULL REFERENCES public.subthemes(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (combo_id, subtheme_id)
);

-- ── 3. Habilitar Row Level Security (RLS) ──
ALTER TABLE public.course_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_subthemes ENABLE ROW LEVEL SECURITY;

-- ── 4. Criar Políticas de Acesso RLS (Autenticado) ──
CREATE POLICY "Course combos - acesso autenticado" 
  ON public.course_combos 
  FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "Combo subthemes - acesso autenticado" 
  ON public.combo_subthemes 
  FOR ALL 
  TO authenticated 
  USING (true);

-- ── 5. Carga de Dados Inicial (Seed) dos Combos Padronizados ──
INSERT INTO public.course_combos (key, label, price, hours) VALUES
  ('basica-8h', 'Brigada Básica 8h', 2400.00, 8.0),
  ('intermediaria-16h', 'Brigada Intermediária 16h', 4800.00, 16.0),
  ('avancada-40h', 'Brigada Avançada 40h', 12000.00, 40.0),
  ('lei-lucas', 'Lei Lucas', 1800.00, 6.0),
  ('reciclagem', 'Reciclagem (Customizada)', 2000.00, 8.0)
ON CONFLICT (key) DO UPDATE 
SET label = EXCLUDED.label, price = EXCLUDED.price, hours = EXCLUDED.hours;

-- ── 6. Carga de Relacionamento de Matérias (Seed do Combo Subthemes) ──
-- Nota: Encontra os UUIDs reais da tabela de subthemes e associa aos combos base criados acima
DO $$
DECLARE
  v_basica_id UUID;
  v_inter_id UUID;
  v_avancada_id UUID;
  v_lucas_id UUID;
  v_reciclagem_id UUID;
BEGIN
  -- Resgata os IDs dos combos
  SELECT id INTO v_basica_id FROM public.course_combos WHERE key = 'basica-8h';
  SELECT id INTO v_inter_id FROM public.course_combos WHERE key = 'intermediaria-16h';
  SELECT id INTO v_avancada_id FROM public.course_combos WHERE key = 'avancada-40h';
  SELECT id INTO v_lucas_id FROM public.course_combos WHERE key = 'lei-lucas';
  SELECT id INTO v_reciclagem_id FROM public.course_combos WHERE key = 'reciclagem';

  -- Limpa relações antigas para evitar duplicidades no seed
  DELETE FROM public.combo_subthemes WHERE combo_id IN (v_basica_id, v_inter_id, v_avancada_id, v_lucas_id, v_reciclagem_id);

  -- A. Vincular Matérias do Combo BÁSICA (8h)
  INSERT INTO public.combo_subthemes (combo_id, subtheme_id)
  SELECT v_basica_id, id FROM public.subthemes
  WHERE name IN (
    'Suporte Básico de Vida',
    'Uso e Manuseio de Extintores',
    'Contexto Histórico do Incêndio',
    'Segurança da Cena',
    'Treinamento para Evacuação'
  ) AND level = 'Bronze'
  ON CONFLICT DO NOTHING;

  -- B. Vincular Matérias do Combo INTERMEDIÁRIA (16h)
  INSERT INTO public.combo_subthemes (combo_id, subtheme_id)
  SELECT v_inter_id, id FROM public.subthemes
  WHERE name IN (
    'Suporte Básico de Vida',
    'Uso e Manuseio de Extintores',
    'Contexto Histórico do Incêndio',
    'Segurança da Cena',
    'Treinamento para Evacuação',
    'Fraturas e Imobilizações',
    'Stop the Bleed',
    'Queimaduras'
  ) AND level = 'Prata'
  ON CONFLICT DO NOTHING;

  -- C. Vincular Matérias do Combo AVANÇADA (40h) - Matérias Nível Ouro
  INSERT INTO public.combo_subthemes (combo_id, subtheme_id)
  SELECT v_avancada_id, id FROM public.subthemes
  WHERE level = 'Ouro'
  ON CONFLICT DO NOTHING;

  -- D. Vincular Matérias do Combo LEI LUCAS (6h)
  INSERT INTO public.combo_subthemes (combo_id, subtheme_id)
  SELECT v_lucas_id, id FROM public.subthemes
  WHERE name IN (
    'Suporte Básico de Vida',
    'Segurança da Cena',
    'Psicologia do Atendimento',
    'Ferimentos em Tecido Mole'
  ) AND level = 'Bronze'
  ON CONFLICT DO NOTHING;

  -- E. Vincular Matérias do Combo RECICLAGEM (Sugeridas, mas comercial monta livre)
  INSERT INTO public.combo_subthemes (combo_id, subtheme_id)
  SELECT v_reciclagem_id, id FROM public.subthemes
  WHERE name IN (
    'Suporte Básico de Vida',
    'Uso e Manuseio de Extintores',
    'Treinamento para Evacuação'
  ) AND level = 'Prata'
  ON CONFLICT DO NOTHING;
END $$;
