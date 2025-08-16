-- Cadastrar administrador com crachá 3360
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
  data_criacao
) VALUES (
  'Administrador 3360',
  '3360',
  '333.600.000-00',
  'Administrador',
  'Sistema',
  '(11) 99999-3360',
  'admin3360',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'cadastrar_colaboradores,cadastrar_administradores,lancamento_horas,desbloquear_usuarios,desativar_usuarios',
  true,
  NOW()
) ON CONFLICT (cracha) DO NOTHING;

-- Verificar se foi criado
SELECT 
  id,
  nome_completo,
  cracha,
  usuario,
  cargo,
  permissoes,
  ativo
FROM administradores 
WHERE cracha = '3360';
