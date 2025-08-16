-- Script para criar administrador padrão se não existir
-- Execute este script no console do Neon

-- Verificar se já existe algum administrador
DO $$
BEGIN
    -- Se não existir nenhum administrador, criar o padrão
    IF NOT EXISTS (SELECT 1 FROM administradores WHERE cracha = 'ADM001') THEN
        INSERT INTO administradores (
            nome_completo,
            cracha,
            cpf,
            cargo,
            empresa,
            telefone,
            usuario,
            senha_hash,
            permissoes,
            ativo,
            criado_em,
            atualizado_em
        ) VALUES (
            'Administrador Master',
            'ADM001',
            '00000000000',
            'Administrador Geral',
            'Sistema',
            '11999999999',
            'admin',
            '$2b$10$rQJ8YnM9wibAR4ENyPKOve6ZKVEiVBaWKdgF0wYdBGIvJ0fUjHQJG', -- Hash para 'admin123'
            'cadastrar_colaboradores,cadastrar_administradores,lancamento_horas,desbloquear_usuarios,desativar_usuarios',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Administrador padrão criado com sucesso!';
    ELSE
        RAISE NOTICE 'Administrador padrão já existe.';
    END IF;
END $$;

-- Verificar se o administrador foi criado
SELECT 
    nome_completo,
    cracha,
    usuario,
    cargo,
    ativo,
    permissoes
FROM administradores 
WHERE cracha = 'ADM001';

-- Mostrar todos os administradores
SELECT COUNT(*) as total_admins FROM administradores WHERE ativo = true;
