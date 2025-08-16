-- Script para verificar se a tabela de folgas existe e tem dados
-- Execute este script no console do Neon para verificar a estrutura

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'solicitacoes_folga'
);

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

-- Verificar quantas folgas pendentes existem
SELECT 
  COUNT(*) as total_folgas,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as folgas_pendentes,
  COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as folgas_aprovadas,
  COUNT(CASE WHEN status = 'recusada' THEN 1 END) as folgas_recusadas,
  COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as folgas_canceladas
FROM solicitacoes_folga;

-- Mostrar folgas pendentes por colaborador
SELECT 
  c.nome,
  c.cracha,
  sf.data_folga,
  sf.horas_debitadas,
  sf.motivo,
  sf.data_solicitacao
FROM solicitacoes_folga sf
JOIN colaboradores c ON sf.colaborador_id = c.id
WHERE sf.status = 'pendente'
ORDER BY sf.data_solicitacao DESC;
