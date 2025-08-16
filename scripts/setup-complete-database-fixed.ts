import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

async function setupDatabase() {
  try {
    console.log("Creating colaboradores table...")

    // Create the colaboradores (employees) table
    await sql`
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
      )
    `

    console.log("Creating hora_lancamentos table...")

    // Create the hora_lancamentos (time entries) table
    await sql`
      CREATE TABLE IF NOT EXISTS hora_lancamentos (
        id SERIAL PRIMARY KEY,
        colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
        data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        horas INTEGER NOT NULL,
        motivo TEXT,
        criado_por VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    console.log("Creating solicitacoes_folga table...")

    // Create the solicitacoes_folga (leave requests) table
    await sql`
      CREATE TABLE IF NOT EXISTS solicitacoes_folga (
        id SERIAL PRIMARY KEY,
        colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
        data_folga DATE NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        horas_debitadas INTEGER NOT NULL,
        motivo TEXT,
        status VARCHAR(20) DEFAULT 'pendente',
        aprovado_por VARCHAR(255),
        observacoes_admin TEXT,
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_resposta TIMESTAMP WITH TIME ZONE
      )
    `

    console.log("Creating indexes...")

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_supervisor ON colaboradores(supervisor)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_turno ON colaboradores(turno)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga)`

    console.log("Inserting sample data...")

    // Insert sample data for testing
    await sql`
      INSERT INTO colaboradores (nome, cracha, codigo_acesso, data_nascimento, cargo, supervisor, turno, telefone) 
      VALUES 
        ('João Silva', '001', '1234', '1990-05-15', 'Operador Empilhadeira', 'Welton Andrade', 'Manhã', '+5511999999001'),
        ('Maria Santos', '002', '5678', '1985-08-22', 'Conferente I', 'Arlem Brito', 'Tarde', '+5511999999002'),
        ('Pedro Oliveira', '003', '9012', '1992-12-10', 'Auxiliar', 'Welton Andrade', 'Noite', '+5511999999003')
      ON CONFLICT (cracha) DO NOTHING
    `

    // Add some sample time entries
    await sql`
      INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
      SELECT id, 8, 'Horas trabalhadas', 'Sistema'
      FROM colaboradores
      WHERE cracha IN ('001', '002', '003')
      ON CONFLICT DO NOTHING
    `

    console.log("Database setup completed successfully!")

    // Verify the setup
    const colaboradores = await sql`SELECT COUNT(*) as count FROM colaboradores`
    const horas = await sql`SELECT COUNT(*) as count FROM hora_lancamentos`
    const folgas = await sql`SELECT COUNT(*) as count FROM solicitacoes_folga`

    console.log(`Colaboradores: ${colaboradores[0].count}`)
    console.log(`Lançamentos de horas: ${horas[0].count}`)
    console.log(`Solicitações de folga: ${folgas[0].count}`)
  } catch (error) {
    console.error("Error setting up database:", error)
    throw error
  }
}

setupDatabase()
