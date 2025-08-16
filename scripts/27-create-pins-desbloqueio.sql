-- Criando tabela pins_desbloqueio para funcionalidade de PIN de desbloqueio
CREATE TABLE IF NOT EXISTS pins_desbloqueio (
    id SERIAL PRIMARY KEY,
    colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id),
    pin CHARACTER VARYING(6) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    ip_address CHARACTER VARYING(45),
    user_agent TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_colaborador_id ON pins_desbloqueio(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_pin ON pins_desbloqueio(pin);
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_usado ON pins_desbloqueio(usado);
CREATE INDEX IF NOT EXISTS idx_pins_desbloqueio_expiracao ON pins_desbloqueio(data_expiracao);

-- Inserindo dados de teste para verificar funcionamento
INSERT INTO pins_desbloqueio (colaborador_id, pin, data_expiracao) 
VALUES (70, '123456', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

SELECT 'Tabela pins_desbloqueio criada com sucesso!' as resultado;
