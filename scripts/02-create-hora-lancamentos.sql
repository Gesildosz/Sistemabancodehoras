-- Criar tabela de lançamentos de horas
CREATE TABLE IF NOT EXISTS hora_lancamentos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horas INTEGER NOT NULL,
  motivo TEXT,
  criado_por VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
