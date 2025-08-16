-- Criar tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cracha VARCHAR(50) UNIQUE NOT NULL,
  codigo_acesso VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  cargo VARCHAR(100),
  supervisor VARCHAR(100),
  turno VARCHAR(20),
  telefone VARCHAR(20),
  tentativas_codigo INTEGER DEFAULT 0,
  bloqueado BOOLEAN DEFAULT FALSE,
  ultimo_token_bloqueio VARCHAR(20),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
