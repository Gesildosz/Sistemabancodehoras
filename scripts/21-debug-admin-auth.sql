-- Script para debugar problemas de autenticação de administradores

-- 1. Verificar se existem administradores cadastrados
SELECT 
    id,
    cracha,
    usuario,
    nome_completo,
    ativo,
    LENGTH(senha_hash) as senha_hash_length,
    LEFT(senha_hash, 10) as senha_hash_preview
FROM administradores 
ORDER BY id;

-- 2. Verificar se as senhas estão com hash bcrypt (devem começar com $2b$)
SELECT 
    usuario,
    CASE 
        WHEN senha_hash LIKE '$2b$%' THEN 'bcrypt'
        WHEN LENGTH(senha_hash) = 64 THEN 'sha256'
        ELSE 'unknown'
    END as hash_type
FROM administradores;

-- 3. Se não houver administradores, criar um de teste
INSERT INTO administradores (
    cracha,
    usuario,
    senha_hash,
    nome_completo,
    cpf,
    cargo,
    empresa,
    telefone,
    permissoes,
    ativo
) 
SELECT 
    'TEST001',
    'admin',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    'Administrador Teste',
    '000.000.000-00',
    'Administrador',
    'Sistema',
    '(11) 99999-9999',
    'cadastrar_colaboradores,cadastrar_administradores,lancamento_horas,desbloquear_usuarios,desativar_usuarios',
    true
WHERE NOT EXISTS (SELECT 1 FROM administradores WHERE usuario = 'admin');

-- 4. Verificar resultado final
SELECT 
    'Total de administradores:' as info,
    COUNT(*) as valor
FROM administradores
UNION ALL
SELECT 
    'Administradores ativos:' as info,
    COUNT(*) as valor
FROM administradores 
WHERE ativo = true;
