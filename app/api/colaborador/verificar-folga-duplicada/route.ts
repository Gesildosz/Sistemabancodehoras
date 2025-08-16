import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, dataFolga } = await request.json()

    if (!colaboradorId || !dataFolga) {
      return NextResponse.json({ error: "Colaborador ID e data são obrigatórios" }, { status: 400 })
    }

    // Verificar se já existe uma solicitação pendente para esta data
    const result = await sql`
      SELECT id, motivo FROM solicitacoes_folga 
      WHERE colaborador_id = ${colaboradorId} 
      AND data_folga = ${dataFolga} 
      AND status = 'pendente'
    `

    if (result.length > 0) {
      return NextResponse.json({
        duplicada: true,
        solicitacaoExistente: result[0],
      })
    }

    return NextResponse.json({ duplicada: false })
  } catch (error) {
    console.error("Erro ao verificar folga duplicada:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
