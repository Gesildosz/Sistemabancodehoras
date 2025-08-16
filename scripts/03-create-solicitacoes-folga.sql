-- Criar tabela de solicitações de folga
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
