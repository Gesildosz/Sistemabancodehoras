-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  lida BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_leitura TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_colaborador ON notificacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);
