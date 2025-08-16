-- Criar tabela para armazenar PINs de desbloqueio
CREATE TABLE IF NOT EXISTS pins_desbloqueio (
    id SERIAL PRIMARY KEY,
    colaborador_id INTEGER NOT NULL,
    cracha VARCHAR(20) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT NOW(),
    expira_em TIMESTAMP NOT NULL,
    processado_em TIMESTAMP NULL,
    processado_por INTEGER NULL,
    UNIQUE(colaborador_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_status ON pins_desbloqueio(status);
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_cracha ON pins_desbloqueio(cracha);
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_expira ON pins_desbloqueio(expira_em);

-- Comentários para documentação
COMMENT ON TABLE pins_desbloqueio IS 'Armazena PINs gerados para desbloqueio de colaboradores';
COMMENT ON COLUMN pins_desbloqueio.status IS 'Status do PIN: pendente, aprovado, rejeitado, expirado';
COMMENT ON COLUMN pins_desbloqueio.expira_em IS 'Data/hora de expiração do PIN (24 horas após criação)';
