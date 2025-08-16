-- Script para corrigir a tabela de notificações
-- Execute este script no console SQL do Neon

-- Verificar se a tabela existe e sua estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notificacoes' 
ORDER BY ordinal_position;

-- Adicionar coluna criado_por se não existir
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS criado_por VARCHAR(255) NOT NULL DEFAULT 'Sistema';

-- Verificar a estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notificacoes' 
ORDER BY ordinal_position;
