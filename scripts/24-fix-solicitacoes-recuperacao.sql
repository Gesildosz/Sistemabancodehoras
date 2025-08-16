-- Verificar e criar tabela para solicitações de recuperação de código
DROP TABLE IF EXISTS solicitacoes_recuperacao CASCADE;

CREATE TABLE solicitacoes_recuperacao (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  empresa VARCHAR(100) NOT NULL,
  nome_supervisor VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  motivo_recusa TEXT,
  aprovada_por INTEGER,
  codigo_temporario_gerado VARCHAR(6),
  criada_em TIMESTAMP DEFAULT NOW(),
  processada_em TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_recuperacao_colaborador ON solicitacoes_recuperacao(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_recuperacao_status ON solicitacoes_recuperacao(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_recuperacao_criada ON solicitacoes_recuperacao(criada_em);
