import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json({ error: "ID do colaborador inválido" }, { status: 400 })
    }

    const colaborador = await db.getColaboradorById(colaboradorId)

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome,
        cracha: colaborador.cracha,
        cargo: colaborador.cargo,
        empresa: colaborador.empresa,
        supervisor: colaborador.supervisor,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar colaborador:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
