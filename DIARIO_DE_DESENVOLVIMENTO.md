# 📋 CBMSC — HUB DO INSTRUTOR B3
## Diário de Desenvolvimento do Projeto

> **Repositório:** `Aulas de Rotinas Administrativas - B3`  
> **Conversation ID:** `a058039f-e54a-4de5-85a5-b9281bdbae99`  
> **Última atualização:** 2026-06-13

---

## 🎯 Objetivo do Projeto

Criar um **Hub digital de instrução** para o setor B3 do CBMSC (Corpo de Bombeiros Militar de Santa Catarina), permitindo que o instrutor:
- Gerencie os **módulos de instrução** (subtemas B3)
- Configure a **grade curricular** do curso
- Crie **turmas** e abra o **Cockpit de Apresentação** para conduzir as aulas
- Permita que os alunos façam **check-in** via QR Code

---

## 🏗️ Origem do Projeto

O projeto foi criado como um **fork/clone** do sistema **SC Fire / Hub do Treinador** (empresa privada de treinamentos de brigada de incêndio), que tinha um fluxo comercial completo:

```
Venda (CRM) → Proposta → Turma → Cockpit de Aula
```

Para o CBMSC, esse fluxo comercial foi **completamente removido** e o sistema foi reorientado para instrução institucional interna.

---

## 🗂️ Estrutura do Projeto

```
Aulas de Rotinas Administrativas - B3/
├── src/
│   ├── app/
│   │   ├── instrutor/
│   │   │   ├── dashboard/      → Painel principal do instrutor
│   │   │   ├── apresentacao/   → Cockpit de aula (slides, cronômetro, QR Code)
│   │   │   ├── turmas/         → Gestão de turmas
│   │   │   ├── cursos/         → Configuração do curso único B3
│   │   │   ├── subtemas/       → Catálogo de módulos de instrução
│   │   │   └── configuracoes/  → Configurações do sistema
│   │   ├── aluno/
│   │   │   ├── portal/         → Portal do aluno (acesso via QR Code)
│   │   │   └── check-in/       → Confirmação de presença
│   │   └── auth/               → Autenticação (login do instrutor)
│   └── lib/
│       └── supabase/           → Client e Server helpers do Supabase
├── supabase/
│   └── migrations/             → Scripts SQL (histórico do banco)
└── public/                     → Assets estáticos
```

---

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| **Next.js 15** (App Router) | Framework principal |
| **TypeScript** | Linguagem |
| **Tailwind CSS v4** | Estilização |
| **Supabase** | Banco de dados PostgreSQL + Auth + Storage |
| **Vercel** | Hospedagem e deploy |
| **GitHub** | Controle de versão |

---

## 📦 Banco de Dados — Contas e Credenciais

> ⚠️ **Guardar com segurança!**

| Item | Valor |
|---|---|
| **Conta Supabase** | augustomus@gmail.com |
| **Projeto Supabase** | `qwuqpdrpnnqetexqztns` |
| **URL do projeto** | `https://qwuqpdrpnnqetexqztns.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXFwZHJwbm5xZXRleHF6dG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODUyODQsImV4cCI6MjA5Njg2MTI4NH0.HyVFyDMvnPs78dh9mh9zJOUuTtEspa6pNc-6mIKzQUY` |
| **Conta Vercel** | galdinomus@gmail.com |

---

## 📝 Histórico de Desenvolvimento

### Sessão 1 — 2026-06-12 (Setup inicial)

**O que foi feito:**
- Criado o repositório `Aulas de Rotinas Administrativas - B3` no GitHub a partir do clone do projeto SC Fire
- Rebranding completo: removido todo visual "SC Fire / BNI", substituído por identidade **CBMSC**
- Corrigidos erros de sintaxe em `globals.css` (line numbers acidentalmente incluídos no arquivo)
- Corrigido erro de JSX em `apresentacao/page.tsx`
- Cockpit de apresentação simplificado: removidas as telas comerciais (pitchs BNI), substituídas por seletor de turma B3
- Portal do aluno e tela de check-in rebranding (CBMSC, sem referências SC Fire)
- Commit inicial feito no repositório GitHub

---

### Sessão 2 — 2026-06-13 (Estrutura B3 + Deploy)

#### ✅ Banco de Dados — Nova conta Supabase criada

Criada **conta separada** no Supabase (`augustomus@gmail.com`) para isolar o projeto B3 do modelo SC Fire.

#### ✅ Migration `006_b3_seed.sql` — Script completo e autossuficiente

Script que funciona em **qualquer banco vazio** ou com schema SC Fire herdado:

1. **Remove check constraints** do modelo antigo:
   - `subthemes_category_check` (só aceitava `Primeiros Socorros`, `Combate a Incêndio`, `SIPAT`)
   - `subthemes_level_check`
   - Constraints `NOT NULL` de `company_id` e `training_id` em `classes`

2. **Adiciona colunas** que faltavam:
   - `classes.name` (nome da turma)
   - `subthemes.syllabus` (conteúdo programático)

3. **Cria tabelas** com `CREATE TABLE IF NOT EXISTS`:
   - `subthemes` — módulos de instrução
   - `course_combos` — curso único B3
   - `combo_subthemes` — vínculo curso ↔ subtema (com `order_index`)
   - `classes` — turmas
   - `class_subthemes` — vínculo turma ↔ subtema
   - `attendances` — presenças
   - `questions` — banco de questões

4. **Configura RLS** (Row Level Security) com políticas para instrutor e aluno

5. **Semeia os dados B3:**

| Subtema | Categoria | Carga |
|---|---|---|
| Coordenação de Bombeiros Comunitários — Parâmetros Gerais | Coordenação | 2h |
| Ficha de Apuração de Conduta | Gestão de Pessoal | 1,5h |
| Escalas de Serviço | Gestão de Pessoal | 1,5h |
| Treinamentos Operacionais | Gestão de Pessoal | 2h |
| Gestão de Pessoal | Gestão de Pessoal | 2h |

6. **Curso único:** "Rotinas Administrativas B3" (9h no total) com todos os subtemas vinculados em ordem

---

#### ✅ Frontend — Aba Subtemas (`/instrutor/subtemas`)

- Mocks atualizados para os 5 subtemas B3 reais (substituindo os de brigada de incêndio)
- Categorias atualizadas: `Coordenação` e `Gestão de Pessoal`
- Função `fromDB()` atualizada para mapear as novas categorias do banco
- Select de categoria no formulário de edição atualizado
- CRUD completo mantido (criar, editar, excluir módulos)

---

#### ✅ Frontend — Aba Cursos (`/instrutor/cursos`)

- Mock atualizado para exibir apenas o **curso único** "Rotinas Administrativas B3"
- Dados carregados do Supabase (combo `rotinas-b3`)
- Modal de configuração permite selecionar quais subtemas compõem o curso
- Removida dependência de categorias SC Fire (SIPAT, Combate a Incêndio)

---

#### ✅ Frontend — Aba Turmas (`/instrutor/turmas`) — Mudança principal

**Antes:** O botão "Nova Turma" redirecionava para `/instrutor/comercial` (rota removida → tela em branco).

**Depois:** Modal direto na própria página com:
- Campo: **Nome da turma** (ex: "1ª Turma B3 — Jun/2026")
- Campo: **Data de início** (date picker)
- **Seleção de subtemas** incluídos (checkboxes com todos os módulos do banco)
- **Resumo automático** de carga horária total
- Ao salvar: cria turma direto na tabela `classes` do Supabase com `status: "agendada"`
- Turma criada aparece na lista e pode ser clicada para abrir o Cockpit

---

#### ✅ Fix Vercel — `export const dynamic = 'force-dynamic'`

O build da Vercel falhava com:
```
Error: @supabase/ssr: Your project's URL and API key are required
```

**Causa:** Next.js tentava pré-renderizar (gerar estático) todas as páginas no momento do build, mas sem as variáveis de ambiente do Supabase disponíveis.

**Solução:** Adicionado `export const dynamic = 'force-dynamic'` em todas as páginas que usam Supabase:
- `instrutor/apresentacao/page.tsx`
- `instrutor/turmas/page.tsx`
- `instrutor/subtemas/page.tsx`
- `instrutor/cursos/page.tsx`
- `instrutor/dashboard/page.tsx`
- `aluno/portal/page.tsx`
- `aluno/check-in/page.tsx`

Commit e push feito: `fix: add force-dynamic to all Supabase pages — fix Vercel prerender error`

---

## 🚀 Para Publicar na Vercel

### Passo 1 — Configurar variáveis de ambiente

Na Vercel → projeto → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://qwuqpdrpnnqetexqztns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXFwZHJwbm5xZXRleHF6dG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODUyODQsImV4cCI6MjA5Njg2MTI4NH0.HyVFyDMvnPs78dh9mh9zJOUuTtEspa6pNc-6mIKzQUY
```

> Selecionar os ambientes: **Production, Preview e Development**

### Passo 2 — Redeploy

Deployments → último deploy → ⋯ → **Redeploy**

---

## 📌 Próximos passos planejados

- [ ] Adicionar mais subtemas B3 via aba Módulos (UI já está pronta)
- [ ] Testar o fluxo completo: criar turma → abrir cockpit → aluno faz check-in
- [ ] Adicionar banco de questões por subtema
- [ ] (Futuro) Certificados de conclusão

---

## 🔗 Links úteis

- **Repositório GitHub:** https://github.com/MuriloGald/Aulas-de-Rotinas-Administrativas---B3
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qwuqpdrpnnqetexqztns
- **Vercel Dashboard:** https://vercel.com (login: galdinomus@gmail.com)
