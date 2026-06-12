-- ══════════════════════════════════════════════════════════════════
-- SC FIRE — Migração 004: Adição de Ementa Detalhada nos Subtemas
-- Execute este script no Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → cole e execute)
-- ══════════════════════════════════════════════════════════════════

-- ── Adicionar coluna syllabus (Ementa / Descrição Detalhada) se não existir ──
ALTER TABLE public.subthemes ADD COLUMN IF NOT EXISTS syllabus TEXT;
