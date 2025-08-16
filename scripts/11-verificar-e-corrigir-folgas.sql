-- Script para verificar e corrigir a tabela de solicitações de folga
-- Execute este script no console do Neon

-- 1. Verificar se a tabela existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_folga'
ORDER BY ordinal_position;

-- 2. Criar a tabela se não existir ou recriar com estrutura correta
DROP TABLE IF EXISTS solicitacoes_folga CASCADE;

CREATE TABLE solicitacoes_folga (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_folga DATE NOT NULL,
  dia_semana VARCHAR(20) NOT NULL,
  horas_debitadas INTEGER NOT NULL,
  motivo TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada', 'cancelada')),
  aprovado_por VARCHAR(255),
  observacoes_admin TEXT,
  data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_resposta TIMESTAMP WITH TIME ZONE
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga);

-- 4. Verificar se a tabela foi criada corretamente
SELECT 'Tabela solicitacoes_folga criada com sucesso' as resultado;
</sql>
