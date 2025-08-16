import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Buscando PINs de desbloqueio")

    const pins = await sql`
      SELECT 
        p.id,
        p.pin,
        p.colaborador_id,
        p.criado_em,
        p.data_expiracao,
        p.usado,
        c.nome as colaborador_nome,
        c.cracha as colaborador_cracha
      FROM pins_desbloqueio p
      JOIN colaboradores c ON p.colaborador_id = c.id
      WHERE p.usado = false
      AND p.data_expiracao > NOW()
      ORDER BY p.criado_em DESC
    `

    console.log("[v0] PINs encontrados:", pins.length)

    return NextResponse.json({ pins })
  } catch (error) {
    console.error("[v0] Erro ao buscar PINs:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
