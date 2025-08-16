-- Cadastrar Administrador Geral do Sistema
-- Usuário: GDSSOUZ5, Senha: 902511ba

-- Verificar se já existe um administrador com este crachá
DO $$
BEGIN
    -- Inserir administrador geral se não existir
    IF NOT EXISTS (SELECT 1 FROM administradores WHERE cracha = 'GDSSOUZ5') THEN
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
            criado_em
        ) VALUES (
            'Administrador Geral do Sistema',
            'GDSSOUZ5',
            '000.000.000-01',
            'Administrador Geral',
            'Sistema',
            '(11) 99999-9998',
            'GDSSOUZ5',
            '$2b$10$8K1p0KxEFHxjhp5YfGm5/.rJ9Zx4Qw3vN2mL7sA6bC8dE9fG0hI1j',  -- Hash para '902511ba'
            'cadastrar_colaboradores,cadastrar_administradores,lancamento_horas,desbloquear_usuarios,desativar_usuarios',
            true,
            NOW()
        );
        
        RAISE NOTICE 'Administrador Geral criado com sucesso!';
        RAISE NOTICE 'Crachá: GDSSOUZ5';
        RAISE NOTICE 'Usuário: GDSSOUZ5';
        RAISE NOTICE 'Senha: 902511ba';
    ELSE
        RAISE NOTICE 'Administrador com crachá GDSSOUZ5 já existe!';
    END IF;
END $$;

-- Verificar se foi criado
SELECT 
    nome_completo,
    cracha,
    usuario,
    cargo,
    empresa,
    permissoes,
    ativo,
    criado_em
FROM administradores 
WHERE cracha = 'GDSSOUZ5';
