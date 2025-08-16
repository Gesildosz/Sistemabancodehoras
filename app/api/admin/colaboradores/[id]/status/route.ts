import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// PATCH - Bloquear/Desbloquear colaborador
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Status API called with ID:", params.id)

    const colaboradorId = Number.parseInt(params.id)
    const body = await request.json()
    const { bloqueado } = body

    console.log("[v0] Updating status to:", bloqueado)

    // Verificar se o colaborador existe
    const colaboradorExistente = await sql`
      SELECT nome FROM colaboradores WHERE id = ${colaboradorId}
    `

    if (colaboradorExistente.length === 0) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    console.log("[v0] Colaborador found:", colaboradorExistente[0].nome)

    // Atualizar status do colaborador
    await sql`
      UPDATE colaboradores 
      SET 
        bloqueado = ${bloqueado},
        tentativas_codigo = ${bloqueado ? 3 : 0}
      WHERE id = ${colaboradorId}
    `

    console.log("[v0] Status updated successfully")

    // Registrar ação no histórico
    await sql`
      INSERT INTO historico_acoes (
        colaborador_id, 
        acao, 
        detalhes, 
        executado_por,
        data_acao
      )
      VALUES (
        ${colaboradorId},
        ${bloqueado ? "BLOQUEIO_MANUAL" : "DESBLOQUEIO_MANUAL"},
        ${bloqueado ? "Colaborador bloqueado manualmente pelo administrador" : "Colaborador desbloqueado manualmente pelo administrador"},
        'Administrador',
        NOW()
      )
    `

    console.log("[v0] History record inserted successfully")

    return NextResponse.json({
      message: `Colaborador ${bloqueado ? "bloqueado" : "desbloqueado"} com sucesso`,
    })
  } catch (error) {
    console.error("[v0] Error in status API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
