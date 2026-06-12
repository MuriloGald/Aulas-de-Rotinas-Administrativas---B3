-- ══════════════════════════════════════════════════════════════════
-- SC FIRE — Migração Inicial do Banco de Dados
-- Execute este script no Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → cole e execute)
-- ══════════════════════════════════════════════════════════════════

-- ── Extensão UUID ──
create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════
-- TABELA: companies (Clientes B2B — multi-tenant)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text not null check (type in ('Indústria', 'Escola', 'Outros')),
  cnpj        text unique,
  email       text,
  phone       text,
  address     text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: subthemes (Os "Legos" — blocos de conteúdo)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.subthemes (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  category     text not null check (category in ('Primeiros Socorros', 'Combate a Incêndio', 'SIPAT')),
  level        text not null check (level in ('Bronze', 'Prata', 'Ouro')),
  hours        numeric(4,1) not null,
  price        numeric(10,2) not null default 0,
  canva_embed  text,         -- URL de incorporação do Canva
  pdf_url      text,         -- URL da apostila no Storage
  description  text,
  in28_code    text,         -- Código da norma IN28 (se aplicável)
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: trainings (Combos/Treinamentos compostos de subtemas)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.trainings (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  base_price   numeric(10,2) not null default 0,
  total_hours  numeric(5,1) not null default 0,
  combo_type   text check (combo_type in ('basica', 'intermediaria', 'avancada', 'lei-lucas', 'customizado')),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: training_subthemes (Relação entre treinamento e subtemas)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.training_subthemes (
  id           uuid primary key default uuid_generate_v4(),
  training_id  uuid not null references public.trainings(id) on delete cascade,
  subtheme_id  uuid not null references public.subthemes(id) on delete restrict,
  sort_order   integer not null default 0,
  is_mandatory boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (training_id, subtheme_id)
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: classes (Turmas — instância de um treinamento p/ empresa)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.classes (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references public.companies(id) on delete restrict,
  training_id     uuid not null references public.trainings(id) on delete restrict,
  instructor_id   uuid references auth.users(id),
  status          text not null default 'agendada' check (status in ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  scheduled_at    timestamptz,
  started_at      timestamptz,
  finished_at     timestamptz,
  location        text,
  notes           text,
  qr_code_token   text unique default encode(gen_random_bytes(16), 'hex'),
  active_subtheme_id uuid references public.subthemes(id) on delete set null,
  interaction_mode   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: students (Alunos — vinculados a uma empresa)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.students (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references public.companies(id) on delete set null,
  full_name   text not null,
  cpf         text unique,
  email       text,
  phone       text,
  role        text,    -- Cargo na empresa
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: attendances (Presenças — reconcilia CSV + QR Code)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.attendances (
  id              uuid primary key default uuid_generate_v4(),
  class_id        uuid not null references public.classes(id) on delete cascade,
  student_id      uuid not null references public.students(id) on delete cascade,
  source          text not null check (source in ('csv', 'qr_code', 'manual')),
  checked_in_at   timestamptz default now(),
  latitude        numeric(10,7),   -- Geolocalização do QR Code
  longitude       numeric(10,7),
  instructor_approved boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (class_id, student_id)
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: exam_questions (Banco de questões por subtema)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.exam_questions (
  id            uuid primary key default uuid_generate_v4(),
  subtheme_id   uuid not null references public.subthemes(id) on delete cascade,
  question_text text not null,
  options       jsonb not null, -- [{"text": "...", "correct": true/false}]
  explanation   text,           -- Explicação mostrada em caso de erro
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════
-- TABELA: exam_results (Resultados das provas dos alunos)
-- ══════════════════════════════════════════════════════════════════
create table if not exists public.exam_results (
  id            uuid primary key default uuid_generate_v4(),
  class_id      uuid not null references public.classes(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  subtheme_id   uuid references public.subthemes(id) on delete set null,
  score         integer not null,        -- 0-100
  passed        boolean not null,
  answers       jsonb,                   -- Respostas salvas
  completed_at  timestamptz default now(),
  unique (class_id, student_id, subtheme_id)
);

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Isolamento Multi-Tenant
-- ══════════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
alter table public.companies       enable row level security;
alter table public.subthemes       enable row level security;
alter table public.trainings       enable row level security;
alter table public.training_subthemes enable row level security;
alter table public.classes         enable row level security;
alter table public.students        enable row level security;
alter table public.attendances     enable row level security;
alter table public.exam_questions  enable row level security;
alter table public.exam_results    enable row level security;

-- Por enquanto: instrutores autenticados têm acesso total (será refinado com roles)
create policy "Instrutores autenticados — leitura total" on public.companies
  for select to authenticated using (true);

create policy "Instrutores autenticados — escrita total" on public.companies
  for all to authenticated using (true) with check (true);

create policy "Subtemas — leitura aberta autenticada" on public.subthemes
  for select to authenticated using (true);

create policy "Subtemas — escrita para instrutores" on public.subthemes
  for all to authenticated using (true) with check (true);

create policy "Trainings — acesso autenticado" on public.trainings
  for all to authenticated using (true) with check (true);

create policy "Training subthemes — acesso autenticado" on public.training_subthemes
  for all to authenticated using (true) with check (true);

create policy "Classes — acesso autenticado" on public.classes
  for all to authenticated using (true) with check (true);

create policy "Students — acesso autenticado" on public.students
  for all to authenticated using (true) with check (true);

create policy "Attendances — acesso autenticado" on public.attendances
  for all to authenticated using (true) with check (true);

create policy "Exam questions — acesso autenticado" on public.exam_questions
  for all to authenticated using (true) with check (true);

create policy "Exam results — acesso autenticado" on public.exam_results
  for all to authenticated using (true) with check (true);

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA — Subtemas iniciais (os 19 "Legos" da SC Fire)
-- ══════════════════════════════════════════════════════════════════
insert into public.subthemes (name, category, level, hours, price) values
  ('Suporte Básico de Vida',                            'Primeiros Socorros', 'Prata',  2.0,  210.00),
  ('Fraturas e Imobilizações',                          'Primeiros Socorros', 'Prata',  1.5,  210.00),
  ('Stop the Bleed',                                    'Primeiros Socorros', 'Prata',  1.0,  210.00),
  ('Transporte e Manuseio de Vítimas',                  'Primeiros Socorros', 'Ouro',   1.0,  300.00),
  ('Casos Clínicos',                                    'Primeiros Socorros', 'Ouro',   2.0,  300.00),
  ('Segurança da Cena',                                 'Primeiros Socorros', 'Bronze', 0.5,  150.00),
  ('Psicologia do Atendimento a Emergência',            'Primeiros Socorros', 'Bronze', 0.5,  150.00),
  ('Ferimentos em Tecido Mole',                         'Primeiros Socorros', 'Bronze', 1.0,  150.00),
  ('Queimaduras',                                       'Primeiros Socorros', 'Prata',  1.0,  210.00),
  ('Contexto Histórico do Incêndio',                    'Combate a Incêndio', 'Bronze', 1.0,  150.00),
  ('Uso e Manuseio de Extintores',                      'Combate a Incêndio', 'Ouro',   1.5,  300.00),
  ('Treinamento para Evacuação',                        'Combate a Incêndio', 'Prata',  1.0,  210.00),
  ('Incêndio em Veículos Elétricos',                    'Combate a Incêndio', 'Prata',  1.0,  210.00),
  ('Gestão de Brigada',                                 'Combate a Incêndio', 'Bronze', 1.5,  150.00),
  ('Sistemas e Medidas Preventivas Contra Incêndio',    'Combate a Incêndio', 'Bronze', 1.5,  150.00),
  ('Sistema Hidráulico (Prática)',                      'Combate a Incêndio', 'Ouro',   2.0,  300.00),
  ('Vistoria no Contexto de Brigada',                   'Combate a Incêndio', 'Bronze', 1.0,  150.00),
  ('Atividade de Brigada de Incêndio',                  'Combate a Incêndio', 'Ouro',   3.0,  300.00),
  ('Direção Segura',                                    'SIPAT',              'Bronze', 1.0,  150.00)
on conflict do nothing;

-- ══════════════════════════════════════════════════════════════════
-- SEED DATA — Questões de Prova (exam_questions)
-- ══════════════════════════════════════════════════════════════════
insert into public.exam_questions (subtheme_id, question_text, options, explanation) values
  (
    (select id from public.subthemes where name = 'Suporte Básico de Vida' limit 1),
    'Qual a frequência ideal de compressões torácicas na RCP em adultos?',
    '[
      {"text": "60 a 80 compressões por minuto", "correct": false},
      {"text": "80 a 100 compressões por minuto", "correct": false},
      {"text": "100 a 120 compressões por minuto", "correct": true},
      {"text": "120 a 140 compressões por minuto", "correct": false}
    ]'::jsonb,
    'De acordo com as diretrizes da AHA, a frequência recomendada de compressões torácicas para RCP em adultos é de 100 a 120 por minuto.'
  ),
  (
    (select id from public.subthemes where name = 'Suporte Básico de Vida' limit 1),
    'Qual a profundidade recomendada para as compressões torácicas em adultos?',
    '[
      {"text": "Pelo menos 2 polegadas (5 cm), não excedendo 2,4 polegadas (6 cm)", "correct": true},
      {"text": "Cerca de 1 a 1,5 polegadas (3 a 4 cm)", "correct": false},
      {"text": "Pelo menos 3 polegadas (8 cm)", "correct": false},
      {"text": "Qualquer profundidade desde que seja rápida", "correct": false}
    ]'::jsonb,
    'A profundidade recomendada para compressões em adultos é de pelo menos 5 cm (2 polegadas) e no máximo 6 cm (2,4 polegadas).'
  ),
  (
    (select id from public.subthemes where name = 'Uso e Manuseio de Extintores' limit 1),
    'Qual tipo de extintor é mais indicado para combater fogo de Classe C (equipamentos elétricos energizados)?',
    '[
      {"text": "Extintor de Água Pressurizada (AP)", "correct": false},
      {"text": "Extintor de Gás Carbônico (CO2) ou Pó Químico Seco (PQS)", "correct": true},
      {"text": "Extintor de Espuma Mecânica", "correct": false},
      {"text": "Qualquer um dos anteriores", "correct": false}
    ]'::jsonb,
    'Extintores de CO2 e Pó Químico Seco não conduzem eletricidade, sendo seguros para equipamentos elétricos energizados (Classe C).'
  ),
  (
    (select id from public.subthemes where name = 'Stop the Bleed' limit 1),
    'Onde deve ser posicionado o torniquete em caso de hemorragia grave em um membro?',
    '[
      {"text": "Diretamente sobre a ferida", "correct": false},
      {"text": "Cerca de 5 a 8 cm (2 a 3 polegadas) acima da ferida, nunca sobre uma articulação", "correct": true},
      {"text": "Abaixo da ferida", "correct": false},
      {"text": "Diretamente sobre o joelho ou cotovelo", "correct": false}
    ]'::jsonb,
    'O torniquete deve ser colocado 5 a 8 cm acima do local do sangramento, entre a ferida e o coração, evitando articulações.'
  )
on conflict do nothing;
