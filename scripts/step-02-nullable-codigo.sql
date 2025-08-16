-- Passo 2: Tornar codigo_acesso nullable
ALTER TABLE colaboradores 
ALTER COLUMN codigo_acesso DROP NOT NULL;
