-- Criar tabela de histórico de ações dos colaboradores
CREATE TABLE IF NOT EXISTS historico_acoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  acao VARCHAR(100) NOT NULL,
  detalhes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  executado_por VARCHAR(255),
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_acoes_colaborador ON historico_acoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_data ON historico_acoes(data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_acao ON historico_acoes(acao);
