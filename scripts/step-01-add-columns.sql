-- Passo 1: Adicionar colunas para código temporário
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS codigo_temporario VARCHAR(20),
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT TRUE;
