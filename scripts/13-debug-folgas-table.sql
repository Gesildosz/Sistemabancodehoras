-- Script para verificar se a tabela de folgas existe e tem dados
-- Execute este script no console do Neon para debug

-- Verificar se a tabela existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_folga'
ORDER BY ordinal_position;

-- Verificar dados na tabela (se existir)
SELECT 
  sf.*,
  c.nome as colaborador_nome
FROM solicitacoes_folga sf
LEFT JOIN colaboradores c ON sf.colaborador_id = c.id
ORDER BY sf.data_solicitacao DESC
LIMIT 10;

-- Contar folgas por status
SELECT status, COUNT(*) as quantidade
FROM solicitacoes_folga
GROUP BY status;

-- Se a tabela não existir, criar ela
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

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga);
