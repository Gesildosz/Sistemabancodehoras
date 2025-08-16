-- Script SQL completo e atualizado para o Sistema de Banco de Horas
-- Execute este script no console do Neon para criar toda a estrutura

-- 1. Criar tabela de colaboradores (com sistema de código temporário)
CREATE TABLE IF NOT EXISTS colaboradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cracha VARCHAR(50) UNIQUE NOT NULL,
  codigo_acesso VARCHAR(255),
  codigo_temporario VARCHAR(20),
  primeiro_acesso BOOLEAN DEFAULT TRUE,
  data_nascimento DATE,
  cargo VARCHAR(100),
  supervisor VARCHAR(100),
  turno VARCHAR(20),
  telefone VARCHAR(20),
  tentativas_codigo INTEGER DEFAULT 0,
  bloqueado BOOLEAN DEFAULT FALSE,
  ultimo_token_bloqueio VARCHAR(20),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de lançamentos de horas
CREATE TABLE IF NOT EXISTS hora_lancamentos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horas INTEGER NOT NULL,
  motivo TEXT,
  criado_por VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de solicitações de folga
CREATE TABLE IF NOT EXISTS solicitacoes_folga (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_folga DATE NOT NULL,
  dia_semana VARCHAR(20) NOT NULL,
  horas_debitadas INTEGER NOT NULL,
  motivo TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  aprovado_por VARCHAR(255),
  observacoes_admin TEXT,
  data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_resposta TIMESTAMP WITH TIME ZONE
);

-- 4. Criar tabela de histórico de ações
CREATE TABLE IF NOT EXISTS historico_acoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  acao VARCHAR(100) NOT NULL,
  detalhes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL DEFAULT 'info',
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criado_por VARCHAR(255) NOT NULL DEFAULT 'Sistema',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha);
CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado);
CREATE INDEX IF NOT EXISTS idx_colaboradores_codigo_temporario ON colaboradores(codigo_temporario);
CREATE INDEX IF NOT EXISTS idx_colaboradores_primeiro_acesso ON colaboradores(primeiro_acesso);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_supervisor ON colaboradores(supervisor);
CREATE INDEX IF NOT EXISTS idx_colaboradores_turno ON colaboradores(turno);

CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga);

CREATE INDEX IF NOT EXISTS idx_historico_acoes_colaborador ON historico_acoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_data ON historico_acoes(data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_acao ON historico_acoes(acao);

CREATE INDEX IF NOT EXISTS idx_notificacoes_colaborador ON notificacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);

-- 7. Inserir dados de teste
INSERT INTO colaboradores (nome, cracha, codigo_temporario, data_nascimento, cargo, supervisor, turno, telefone) VALUES 
('João Silva', '001', 'TEMP001', '1990-05-15', 'Operador Empilhadeira', 'Welton Andrade', 'Manhã', '+5511999999001'),
('Maria Santos', '002', 'TEMP002', '1985-08-22', 'Conferente I', 'Arlem Brito', 'Tarde', '+5511999999002'),
('Pedro Oliveira', '003', 'TEMP003', '1992-12-10', 'Auxiliar', 'Welton Andrade', 'Noite', '+5511999999003'),
('Ana Costa', '004', 'TEMP004', '1988-03-18', 'Supervisora', 'Direção', 'Manhã', '+5511999999004'),
('Carlos Mendes', '005', 'TEMP005', '1995-11-25', 'Operador', 'Ana Costa', 'Tarde', '+5511999999005')
ON CONFLICT (cracha) DO NOTHING;

-- 8. Inserir alguns lançamentos de horas de exemplo
INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por) VALUES 
(1, 40, 'Saldo inicial', 'Sistema'),
(2, 35, 'Saldo inicial', 'Sistema'),
(3, 28, 'Saldo inicial', 'Sistema'),
(4, 45, 'Saldo inicial', 'Sistema'),
(5, 32, 'Saldo inicial', 'Sistema');

-- 9. Verificar se tudo foi criado corretamente
SELECT 
  'colaboradores' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN primeiro_acesso = TRUE THEN 1 END) as primeiro_acesso_true,
  COUNT(CASE WHEN codigo_temporario IS NOT NULL THEN 1 END) as com_codigo_temporario
FROM colaboradores
UNION ALL
SELECT 
  'hora_lancamentos' as tabela,
  COUNT(*) as total_registros,
  0 as primeiro_acesso_true,
  0 as com_codigo_temporario
FROM hora_lancamentos
UNION ALL
SELECT 
  'solicitacoes_folga' as tabela,
  COUNT(*) as total_registros,
  0 as primeiro_acesso_true,
  0 as com_codigo_temporario
FROM solicitacoes_folga
UNION ALL
SELECT 
  'historico_acoes' as tabela,
  COUNT(*) as total_registros,
  0 as primeiro_acesso_true,
  0 as com_codigo_temporario
FROM historico_acoes
UNION ALL
SELECT 
  'notificacoes' as tabela,
  COUNT(*) as total_registros,
  0 as primeiro_acesso_true,
  0 as com_codigo_temporario
FROM notificacoes;
