-- Passo 3: Criar tabela de histórico de ações
CREATE TABLE IF NOT EXISTS historico_acoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  acao VARCHAR(100) NOT NULL,
  detalhes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
