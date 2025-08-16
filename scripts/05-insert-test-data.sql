-- Inserir dados de teste
INSERT INTO colaboradores (nome, cracha, codigo_acesso, data_nascimento, cargo, supervisor, turno, telefone) VALUES 
('João Silva', '001', '1234', '1990-05-15', 'Operador Empilhadeira', 'Welton Andrade', 'Manhã', '+5511999999001'),
('Maria Santos', '002', '5678', '1985-08-22', 'Conferente I', 'Arlem Brito', 'Tarde', '+5511999999002'),
('Pedro Oliveira', '003', '9012', '1992-12-10', 'Auxiliar', 'Welton Andrade', 'Noite', '+5511999999003')
ON CONFLICT (cracha) DO NOTHING;
