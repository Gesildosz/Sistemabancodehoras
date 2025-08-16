import { type NextRequest, NextResponse } from "next/server"
import {
  getNotificacoesColaborador,
  getNotificacoesNaoLidas,
  marcarNotificacaoLida,
  marcarTodasLidas,
} from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    if (tipo === "count") {
      const count = await getNotificacoesNaoLidas(colaboradorId)
      return NextResponse.json({ count })
    }

    const notificacoes = await getNotificacoesColaborador(colaboradorId)
    return NextResponse.json({ notificacoes })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)
    const { notificacaoId, marcarTodas } = await request.json()

    if (marcarTodas) {
      await marcarTodasLidas(colaboradorId)
    } else if (notificacaoId) {
      await marcarNotificacaoLida(notificacaoId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
