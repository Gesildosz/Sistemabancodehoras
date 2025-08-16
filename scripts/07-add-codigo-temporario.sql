-- Adicionar campos para código temporário
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS codigo_temporario VARCHAR(255),
ADD COLUMN IF NOT EXISTS codigo_temporario_usado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT TRUE;

-- Atualizar colaboradores existentes com códigos temporários
UPDATE colaboradores 
SET 
  codigo_temporario = codigo_acesso,
  primeiro_acesso = TRUE,
  codigo_temporario_usado = FALSE
WHERE codigo_temporario IS NULL;
