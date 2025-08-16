import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Verificando status do sistema")

    const result = await sql`
      SELECT ativo, mensagem
      FROM manutencao_sistema 
      ORDER BY id DESC 
      LIMIT 1
    `

    const status = result[0] || { ativo: false, mensagem: "Sistema em manutenção. Tente novamente mais tarde." }

    console.log("[v0] Status do sistema:", status)

    return NextResponse.json({
      emManutencao: status.ativo,
      mensagem: status.mensagem,
    })
  } catch (error) {
    console.error("[v0] Erro ao verificar status do sistema:", error)
    return NextResponse.json({
      emManutencao: false,
      mensagem: "Sistema disponível",
    })
  }
}
