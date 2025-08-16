-- Script para corrigir a tabela de administradores
-- Execute este script no console SQL do Neon

-- Verificar se a tabela administradores existe, se não, criar
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
  permissoes TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando
ALTER TABLE administradores 
ADD COLUMN IF NOT EXISTS permissoes TEXT NOT NULL DEFAULT '';

ALTER TABLE administradores 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE administradores 
ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE administradores 
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_administradores_cracha ON administradores(cracha);
CREATE INDEX IF NOT EXISTS idx_administradores_cpf ON administradores(cpf);
CREATE INDEX IF NOT EXISTS idx_administradores_usuario ON administradores(usuario);
CREATE INDEX IF NOT EXISTS idx_administradores_ativo ON administradores(ativo);

-- Inserir administrador padrão para teste (se não existir)
INSERT INTO administradores (
  nome_completo, 
  cracha, 
  cpf, 
  cargo, 
  empresa, 
  telefone, 
  usuario, 
  senha_hash, 
  permissoes
) VALUES (
  'Administrador Master',
  'ADM001',
  '000.000.000-00',
  'Administrador Geral',
  'Sistema',
  '(11) 99999-9999',
  'admin',
  '$2b$10$rQZ8kqXvJ5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K',
  'cadastrar_colaboradores,cadastrar_administradores,lancamento_horas,desbloqueio_usuarios,desativar_usuarios'
) ON CONFLICT (cracha) DO NOTHING;

-- Verificar se as alterações foram aplicadas
SELECT 
  'administradores' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN ativo = TRUE THEN 1 END) as administradores_ativos
FROM administradores;
