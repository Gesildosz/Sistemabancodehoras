import { NextResponse } from "next/server"
import { getHistoricoAcoes } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get("colaboradorId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const historico = await getHistoricoAcoes(colaboradorId ? Number.parseInt(colaboradorId) : undefined, limit)

    return NextResponse.json(historico)
  } catch (error) {
    console.error("Erro ao buscar histórico de ações:", error)
    return NextResponse.json({ error: "Erro ao buscar histórico de ações" }, { status: 500 })
  }
}
