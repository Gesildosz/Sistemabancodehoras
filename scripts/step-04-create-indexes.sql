-- Passo 4: Criar índices
CREATE INDEX IF NOT EXISTS idx_colaboradores_codigo_temporario ON colaboradores(codigo_temporario);
CREATE INDEX IF NOT EXISTS idx_colaboradores_primeiro_acesso ON colaboradores(primeiro_acesso);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_colaborador ON historico_acoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_data ON historico_acoes(data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acoes_acao ON historico_acoes(acao);
