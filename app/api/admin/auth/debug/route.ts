import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { usuario, senha } = await request.json()

    // Buscar administrador
    const result = await sql`
      SELECT id, usuario, senha_hash, ativo, nome_completo
      FROM administradores 
      WHERE usuario = ${usuario}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Usuário não encontrado",
        debug: { usuario, found: false },
      })
    }

    const admin = result.rows[0]

    // Verificar se está ativo
    if (!admin.ativo) {
      return NextResponse.json({
        success: false,
        error: "Administrador inativo",
        debug: { usuario, found: true, ativo: false },
      })
    }

    // Testar comparação de senha
    const senhaValida = await bcrypt.compare(senha, admin.senha_hash)

    return NextResponse.json({
      success: senhaValida,
      error: senhaValida ? null : "Senha inválida",
      debug: {
        usuario,
        found: true,
        ativo: admin.ativo,
        hashType: admin.senha_hash.startsWith("$2b$") ? "bcrypt" : "other",
        hashLength: admin.senha_hash.length,
        senhaValida,
      },
    })
  } catch (error) {
    console.error("Erro no debug de autenticação:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
      debug: { error: error.message },
    })
  }
}
