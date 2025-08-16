-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha);
CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status);
