-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS administradores (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  cracha VARCHAR(50) UNIQUE NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  empresa VARCHAR(100) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de permissões de administradores
CREATE TABLE IF NOT EXISTS admin_permissoes (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES administradores(id) ON DELETE CASCADE,
  cadastrar_colaboradores BOOLEAN DEFAULT FALSE,
  cadastrar_administradores BOOLEAN DEFAULT FALSE,
  lancamento_horas BOOLEAN DEFAULT FALSE,
  desbloquear_usuarios BOOLEAN DEFAULT FALSE,
  desativar_usuarios BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_administradores_cracha ON administradores(cracha);
CREATE INDEX IF NOT EXISTS idx_administradores_cpf ON administradores(cpf);
CREATE INDEX IF NOT EXISTS idx_administradores_usuario ON administradores(usuario);
CREATE INDEX IF NOT EXISTS idx_administradores_ativo ON administradores(ativo);
CREATE INDEX IF NOT EXISTS idx_admin_permissoes_admin ON admin_permissoes(admin_id);

-- Inserir administrador padrão (usuário: admin, senha: admin123)
INSERT INTO administradores (nome_completo, cracha, cpf, cargo, empresa, telefone, usuario, senha_hash) 
VALUES ('Administrador Sistema', 'ADM001', '000.000.000-00', 'Administrador Geral', 'Sistema', '(11) 99999-9999', 'admin', '$2b$10$rQZ9QZ9QZ9QZ9QZ9QZ9QZO')
ON CONFLICT (cracha) DO NOTHING;

-- Inserir permissões completas para o admin padrão
INSERT INTO admin_permissoes (admin_id, cadastrar_colaboradores, cadastrar_administradores, lancamento_horas, desbloquear_usuarios, desativar_usuarios)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE FROM administradores WHERE usuario = 'admin'
ON CONFLICT DO NOTHING;
