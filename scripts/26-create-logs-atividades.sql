-- Criar tabela de logs de atividades
CREATE TABLE IF NOT EXISTS logs_atividades (
    id SERIAL PRIMARY KEY,
    colaborador_id INTEGER REFERENCES colaboradores(id),
    admin_id INTEGER REFERENCES administradores(id),
    tipo VARCHAR(50) NOT NULL, -- 'acesso', 'erro_codigo', 'solicitacao', 'bloqueio', 'desbloqueio', 'lancamento_horas'
    descricao TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    sucesso BOOLEAN DEFAULT true,
    dados_extras JSONB, -- Para armazenar dados adicionais específicos do tipo de atividade
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logs_atividades_colaborador_id ON logs_atividades(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_admin_id ON logs_atividades(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_tipo ON logs_atividades(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_data_hora ON logs_atividades(data_hora);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_sucesso ON logs_atividades(sucesso);

-- Inserir alguns dados de exemplo para teste
INSERT INTO logs_atividades (colaborador_id, tipo, descricao, ip_address, sucesso) VALUES
(1, 'acesso', 'Login realizado com sucesso', '192.168.1.100', true),
(1, 'erro_codigo', 'Tentativa de acesso com código incorreto', '192.168.1.100', false),
(2, 'solicitacao', 'Solicitação de folga enviada', '192.168.1.101', true),
(1, 'lancamento_horas', 'Horas lançadas pelo administrador', '192.168.1.102', true);

-- Inserir dados de exemplo para as últimas 24 horas (distribuídos por hora)
INSERT INTO logs_atividades (colaborador_id, tipo, descricao, ip_address, sucesso, data_hora) VALUES
(1, 'acesso', 'Login matinal', '192.168.1.100', true, NOW() - INTERVAL '8 hours'),
(2, 'acesso', 'Login matinal', '192.168.1.101', true, NOW() - INTERVAL '8 hours'),
(1, 'erro_codigo', 'Código incorreto', '192.168.1.100', false, NOW() - INTERVAL '6 hours'),
(3, 'acesso', 'Login tarde', '192.168.1.102', true, NOW() - INTERVAL '4 hours'),
(2, 'solicitacao', 'Solicitação de folga', '192.168.1.101', true, NOW() - INTERVAL '3 hours'),
(1, 'acesso', 'Login noturno', '192.168.1.100', true, NOW() - INTERVAL '2 hours');
