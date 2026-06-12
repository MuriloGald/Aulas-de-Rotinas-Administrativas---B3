-- ══════════════════════════════════════════════════════════════════
-- SC FIRE — Migração 003: Expansão do Catálogo de Subtemas
-- Execute este script no Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → cole e execute)
-- ══════════════════════════════════════════════════════════════════

-- ── Limpar tabela existente (Cascade limpa relacionamentos) ──
TRUNCATE TABLE public.subthemes CASCADE;

-- ── Inserir Catálogo Completo (57 Registros — 3 versões para cada uma das 19 matérias) ──
INSERT INTO public.subthemes (name, category, level, hours, price) VALUES
  -- 1. Suporte Básico de Vida (Primeiros Socorros)
  ('Suporte Básico de Vida', 'Primeiros Socorros', 'Bronze', 1.0, 150.00),
  ('Suporte Básico de Vida', 'Primeiros Socorros', 'Prata',  2.0, 210.00),
  ('Suporte Básico de Vida', 'Primeiros Socorros', 'Ouro',   3.0, 300.00),

  -- 2. Fraturas e Imobilizações (Primeiros Socorros)
  ('Fraturas e Imobilizações', 'Primeiros Socorros', 'Bronze', 1.0, 150.00),
  ('Fraturas e Imobilizações', 'Primeiros Socorros', 'Prata',  1.5, 210.00),
  ('Fraturas e Imobilizações', 'Primeiros Socorros', 'Ouro',   2.5, 300.00),

  -- 3. Stop the Bleed (Primeiros Socorros)
  ('Stop the Bleed', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Stop the Bleed', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Stop the Bleed', 'Primeiros Socorros', 'Ouro',   2.0, 300.00),

  -- 4. Transporte e Manuseio de Vítimas (Primeiros Socorros)
  ('Transporte e Manuseio de Vítimas', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Transporte e Manuseio de Vítimas', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Transporte e Manuseio de Vítimas', 'Primeiros Socorros', 'Ouro',   2.0, 300.00),

  -- 5. Casos Clínicos (Primeiros Socorros)
  ('Casos Clínicos', 'Primeiros Socorros', 'Bronze', 1.0, 150.00),
  ('Casos Clínicos', 'Primeiros Socorros', 'Prata',  2.0, 210.00),
  ('Casos Clínicos', 'Primeiros Socorros', 'Ouro',   3.0, 300.00),

  -- 6. Segurança da Cena (Primeiros Socorros)
  ('Segurança da Cena', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Segurança da Cena', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Segurança da Cena', 'Primeiros Socorros', 'Ouro',   1.5, 300.00),

  -- 7. Psicologia do Atendimento a Emergência (Primeiros Socorros)
  ('Psicologia do Atendimento a Emergência', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Psicologia do Atendimento a Emergência', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Psicologia do Atendimento a Emergência', 'Primeiros Socorros', 'Ouro',   1.5, 300.00),

  -- 8. Ferimentos em Tecido Mole (Primeiros Socorros)
  ('Ferimentos em Tecido Mole', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Ferimentos em Tecido Mole', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Ferimentos em Tecido Mole', 'Primeiros Socorros', 'Ouro',   1.5, 300.00),

  -- 9. Queimaduras (Primeiros Socorros)
  ('Queimaduras', 'Primeiros Socorros', 'Bronze', 0.5, 150.00),
  ('Queimaduras', 'Primeiros Socorros', 'Prata',  1.0, 210.00),
  ('Queimaduras', 'Primeiros Socorros', 'Ouro',   2.0, 300.00),

  -- 10. Contexto Histórico do Incêndio (Combate a Incêndio)
  ('Contexto Histórico do Incêndio', 'Combate a Incêndio', 'Bronze', 0.5, 150.00),
  ('Contexto Histórico do Incêndio', 'Combate a Incêndio', 'Prata',  1.0, 210.00),
  ('Contexto Histórico do Incêndio', 'Combate a Incêndio', 'Ouro',   1.5, 300.00),

  -- 11. Uso e Manuseio de Extintores (Combate a Incêndio)
  ('Uso e Manuseio de Extintores', 'Combate a Incêndio', 'Bronze', 0.5, 150.00),
  ('Uso e Manuseio de Extintores', 'Combate a Incêndio', 'Prata',  1.0, 210.00),
  ('Uso e Manuseio de Extintores', 'Combate a Incêndio', 'Ouro',   1.5, 300.00),

  -- 12. Treinamento para Evacuação (Combate a Incêndio)
  ('Treinamento para Evacuação', 'Combate a Incêndio', 'Bronze', 0.5, 150.00),
  ('Treinamento para Evacuação', 'Combate a Incêndio', 'Prata',  1.0, 210.00),
  ('Treinamento para Evacuação', 'Combate a Incêndio', 'Ouro',   2.0, 300.00),

  -- 13. Incêndio em Veículos Elétricos (Combate a Incêndio)
  ('Incêndio em Veículos Elétricos', 'Combate a Incêndio', 'Bronze', 0.5, 150.00),
  ('Incêndio em Veículos Elétricos', 'Combate a Incêndio', 'Prata',  1.0, 210.00),
  ('Incêndio em Veículos Elétricos', 'Combate a Incêndio', 'Ouro',   2.0, 300.00),

  -- 14. Gestão de Brigada (Combate a Incêndio)
  ('Gestão de Brigada', 'Combate a Incêndio', 'Bronze', 1.0, 150.00),
  ('Gestão de Brigada', 'Combate a Incêndio', 'Prata',  1.5, 210.00),
  ('Gestão de Brigada', 'Combate a Incêndio', 'Ouro',   2.5, 300.00),

  -- 15. Sistemas e Medidas Preventivas Contra Incêndio (Combate a Incêndio)
  ('Sistemas e Medidas Preventivas Contra Incêndio', 'Combate a Incêndio', 'Bronze', 1.0, 150.00),
  ('Sistemas e Medidas Preventivas Contra Incêndio', 'Combate a Incêndio', 'Prata',  1.5, 210.00),
  ('Sistemas e Medidas Preventivas Contra Incêndio', 'Combate a Incêndio', 'Ouro',   2.5, 300.00),

  -- 16. Sistema Hidráulico (Prática) (Combate a Incêndio)
  ('Sistema Hidráulico (Prática)', 'Combate a Incêndio', 'Bronze', 1.0, 150.00),
  ('Sistema Hidráulico (Prática)', 'Combate a Incêndio', 'Prata',  2.0, 210.00),
  ('Sistema Hidráulico (Prática)', 'Combate a Incêndio', 'Ouro',   3.0, 300.00),

  -- 17. Vistoria no Contexto de Brigada (Combate a Incêndio)
  ('Vistoria no Contexto de Brigada', 'Combate a Incêndio', 'Bronze', 0.5, 150.00),
  ('Vistoria no Contexto de Brigada', 'Combate a Incêndio', 'Prata',  1.0, 210.00),
  ('Vistoria no Contexto de Brigada', 'Combate a Incêndio', 'Ouro',   2.0, 300.00),

  -- 18. Atividade de Brigada de Incêndio (Combate a Incêndio)
  ('Atividade de Brigada de Incêndio', 'Combate a Incêndio', 'Bronze', 1.5, 150.00),
  ('Atividade de Brigada de Incêndio', 'Combate a Incêndio', 'Prata',  3.0, 210.00),
  ('Atividade de Brigada de Incêndio', 'Combate a Incêndio', 'Ouro',   4.5, 300.00),

  -- 19. Direção Segura (SIPAT)
  ('Direção Segura', 'SIPAT', 'Bronze', 0.5, 150.00),
  ('Direção Segura', 'SIPAT', 'Prata',  1.0, 210.00),
  ('Direção Segura', 'SIPAT', 'Ouro',   2.0, 300.00)
ON CONFLICT DO NOTHING;
