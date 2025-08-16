-- Passo 5: Atualizar registros existentes
UPDATE colaboradores 
SET primeiro_acesso = FALSE 
WHERE codigo_acesso IS NOT NULL AND codigo_acesso != 'TEMP_PLACEHOLDER';
