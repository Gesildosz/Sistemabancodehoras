-- Verificar se a tabela solicitacoes_recuperacao existe e criar se necessário
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'solicitacoes_recuperacao') THEN
        -- Criar tabela para solicitações de recuperação de código
        CREATE TABLE solicitacoes_recuperacao (
          id SERIAL PRIMARY KEY,
          colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id),
          nome_completo VARCHAR(255) NOT NULL,
          cargo VARCHAR(100) NOT NULL,
          empresa VARCHAR(100) NOT NULL,
          nome_supervisor VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
          motivo_recusa TEXT,
          aprovada_por INTEGER REFERENCES administradores(id),
          codigo_temporario_gerado VARCHAR(6),
          criada_em TIMESTAMP DEFAULT NOW(),
          processada_em TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT
        );

        -- Criar índices para melhor performance
        CREATE INDEX idx_solicitacoes_recuperacao_colaborador ON solicitacoes_recuperacao(colaborador_id);
        CREATE INDEX idx_solicitacoes_recuperacao_status ON solicitacoes_recuperacao(status);
        CREATE INDEX idx_solicitacoes_recuperacao_criada ON solicitacoes_recuperacao(criada_em);
        
        RAISE NOTICE 'Tabela solicitacoes_recuperacao criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela solicitacoes_recuperacao já existe.';
    END IF;
END $$;

-- Verificar dados existentes
SELECT 
    COUNT(*) as total_solicitacoes,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'recusada' THEN 1 END) as recusadas
FROM solicitacoes_recuperacao;
