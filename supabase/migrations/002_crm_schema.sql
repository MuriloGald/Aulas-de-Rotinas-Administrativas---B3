-- TABELA DE LEADS (Funil de Vendas)
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  stage VARCHAR(30) DEFAULT 'novo' CHECK (stage IN ('novo', 'contatado', 'proposta_enviada', 'negociacao', 'ganho', 'perdido')),
  expected_value NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA DE INTERAÇÕES (Histórico de Contatos)
CREATE TABLE IF NOT EXISTS crm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('ligacao', 'email', 'reuniao', 'nota', 'proposta_enviada')),
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA DE CONTRATOS RECORRENTES (Foco em Compliance B2B)
CREATE TABLE IF NOT EXISTS crm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  training_id UUID REFERENCES trainings(id),
  value NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirando', 'expirado')),
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HABILITAR RLS NAS TABELAS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contracts ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (Permissivo para desenvolvimento/instrutor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations for authenticated users on crm_leads'
  ) THEN
    CREATE POLICY "Allow all operations for authenticated users on crm_leads" ON crm_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations for authenticated users on crm_interactions'
  ) THEN
    CREATE POLICY "Allow all operations for authenticated users on crm_interactions" ON crm_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations for authenticated users on crm_contracts'
  ) THEN
    CREATE POLICY "Allow all operations for authenticated users on crm_contracts" ON crm_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- SEED DATA PARA O CRM (Leads e Interações)
INSERT INTO crm_leads (id, company_name, contact_name, contact_phone, contact_email, stage, expected_value, notes) VALUES
('a0000000-0000-0000-0000-000000000001', 'Rodobelo Transportes', 'Carlos Albuquerque', '(11) 98888-7777', 'carlos.rodobelo@gmail.com', 'novo', 4800.00, 'Interesse em fechar Brigada Intermediária para 22 motoristas. Exigência IN28.'),
('a0000000-0000-0000-0000-000000000002', 'Supermercados Pão e Mel', 'Beatriz Santos', '(11) 97777-6666', 'beatriz.hr@paomel.com.br', 'contatado', 2400.00, 'Ligação fria realizada. Beatriz solicitou portfólio completo da Lei Lucas e brigada de incêndio básica.'),
('a0000000-0000-0000-0000-000000000003', 'Condomínio Spazio Di Fiori', 'Síndico Marcos', '(11) 96666-5555', 'spaziodifiori@hotmail.com', 'proposta_enviada', 1200.00, 'Proposta de SIPAT + Extintores Bronze enviada por e-mail. Aguardando assembleia dos condôminos.'),
('a0000000-0000-0000-0000-000000000004', 'Logística Expressa Ltda', 'Fernando Lima', '(11) 95555-4444', 'fernando@logexpress.com.br', 'negociacao', 12000.00, 'Reunião comercial feita. Estão pedindo desconto de 10% no combo de Brigada Avançada 40h B2B.'),
('a0000000-0000-0000-0000-000000000005', 'Indústrias MetalLeve', 'Renata Souza', '(11) 94444-3333', 'renata.souza@metalleve.com.br', 'ganho', 4800.00, 'Fechado! Contrato assinado e turma de Brigada Intermediária gerada no Cockpit.'),
('a0000000-0000-0000-0000-000000000006', 'Hospital Santa Clara', 'Dr. Roberto', '(11) 93333-2222', 'roberto@santaclarahosp.com.br', 'perdido', 8000.00, 'Perdido por preço. Fecharam com concorrente local por R$6.500.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_interactions (lead_id, interaction_type, content) VALUES
('a0000000-0000-0000-0000-000000000002', 'ligacao', 'Ligação inicial para apresentação do portfólio. Beatriz se mostrou muito simpática.'),
('a0000000-0000-0000-0000-000000000003', 'email', 'Envio formal do orçamento em PDF com subtemas IN28 e custos detalhados.'),
('a0000000-0000-0000-0000-000000000004', 'reuniao', 'Reunião de alinhamento com engenheiro de segurança. Pediram adequações na carga prática.'),
('a0000000-0000-0000-0000-000000000004', 'nota', 'Nota: O Diretor Financeiro precisa dar a palavra final sobre o desconto solicitado.'),
('a0000000-0000-0000-0000-000000000005', 'proposta_enviada', 'Assinatura eletrônica concluída via sistema SC Fire.')
ON CONFLICT (id) DO NOTHING;
