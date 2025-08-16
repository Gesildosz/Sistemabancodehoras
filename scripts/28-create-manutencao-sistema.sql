-- Criar tabela para controle de manutenção do sistema
CREATE TABLE IF NOT EXISTS manutencao_sistema (
    id SERIAL PRIMARY KEY,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    mensagem TEXT DEFAULT 'Sistema em manutenção. Tente novamente mais tarde.',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    criado_por VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial (manutenção desativada)
INSERT INTO manutencao_sistema (ativo, mensagem, criado_por) 
VALUES (FALSE, 'Sistema em manutenção. Tente novamente mais tarde.', 'SISTEMA')
ON CONFLICT DO NOTHING;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_manutencao_ativo ON manutencao_sistema(ativo);

-- Comentários para documentação
COMMENT ON TABLE manutencao_sistema IS 'Controla o status de manutenção do sistema';
COMMENT ON COLUMN manutencao_sistema.ativo IS 'Se TRUE, sistema está em manutenção para colaboradores';
COMMENT ON COLUMN manutencao_sistema.mensagem IS 'Mensagem exibida durante manutenção';
