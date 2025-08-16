-- Script para atualizar o banco de dados com sistema de código temporário
-- Execute este script no console SQL do Neon

-- 1. Adicionar campos para código temporário na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS codigo_temporario VARCHAR(20),
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT TRUE;

-- 2. Tornar codigo_acesso nullable (para colaboradores que ainda não definiram código fixo)
ALTER TABLE colaboradores 
ALTER COLUMN codigo_acesso DROP NOT NULL;

-- 3. Criar tabela de histórico de ações
CREATE TABLE IF NOT EXISTS historico_acoes (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  acao VARCHAR(100) NOT NULL,
  detalhes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_codigo_temporario ON colaboradores(codigo_temporario);
CREATE INDEX IF NOT EXISTS idx_colaboradores_primeiro_acesso ON colaboradores(primeiro_acesso);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_colaborador ON historico_acoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_data ON historico_acoes(data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_acao ON historico_acoes(acao);

-- 5. Atualizar colaboradores existentes (definir como não sendo primeiro acesso)
UPDATE colaboradores 
SET primeiro_acesso = FALSE 
WHERE codigo_acesso IS NOT NULL AND codigo_acesso != 'TEMP_PLACEHOLDER';

-- 6. Verificar se as alterações foram aplicadas
SELECT 
  'colaboradores' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN primeiro_acesso = TRUE THEN 1 END) as primeiro_acesso_true,
  COUNT(CASE WHEN codigo_temporario IS NOT NULL THEN 1 END) as com_codigo_temporario
FROM colaboradores
UNION ALL
SELECT 
  'historico_acoes' as tabela,
  COUNT(*) as total_registros,
  0 as primeiro_acesso_true,
  0 as com_codigo_temporario
FROM historico_acoes;
