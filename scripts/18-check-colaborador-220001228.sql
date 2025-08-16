-- Verificar dados do colaborador com crachá 220001228
SELECT 
    cracha,
    nome,
    codigo_acesso,
    codigo_temporario,
    primeiro_acesso,
    bloqueado,
    cargo,
    turno,
    supervisor
FROM colaboradores 
WHERE cracha = '220001228';

-- Se não existir, criar colaborador de teste
INSERT INTO colaboradores (
    cracha, 
    nome, 
    codigo_acesso, 
    primeiro_acesso, 
    bloqueado, 
    cargo, 
    turno, 
    supervisor,
    telefone,
    data_nascimento,
    criado_em
) 
SELECT 
    '220001228',
    'Colaborador Teste',
    '1234',
    FALSE,
    FALSE,
    'Operador',
    'Manhã',
    'Supervisor Teste',
    '(11) 99999-9999',
    '1990-01-01',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM colaboradores WHERE cracha = '220001228'
);

-- Verificar resultado final
SELECT 
    cracha,
    nome,
    codigo_acesso,
    primeiro_acesso,
    bloqueado
FROM colaboradores 
WHERE cracha = '220001228';
