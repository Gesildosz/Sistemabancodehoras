-- Make codigo_acesso nullable and add default for existing records
ALTER TABLE colaboradores ALTER COLUMN codigo_acesso DROP NOT NULL;

-- Update existing records that might have null codigo_acesso
UPDATE colaboradores 
SET codigo_acesso = 'TEMP_PLACEHOLDER' 
WHERE codigo_acesso IS NULL;
