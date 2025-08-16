-- Passo 6: Verificar se as mudanças foram aplicadas
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
ORDER BY ordinal_position;

-- Verificar dados
SELECT * FROM colaboradores LIMIT 5;
