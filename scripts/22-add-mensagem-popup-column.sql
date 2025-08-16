-- Add mensagem_popup column to hora_lancamentos table
ALTER TABLE hora_lancamentos 
ADD COLUMN IF NOT EXISTS mensagem_popup TEXT DEFAULT '';

-- Add index for better performance on recent updates queries
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador_data 
ON hora_lancamentos(colaborador_id, data_lancamento DESC);
