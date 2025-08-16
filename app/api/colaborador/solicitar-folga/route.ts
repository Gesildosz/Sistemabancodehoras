import { type NextRequest, NextResponse } from "next/server"
import { createSolicitacaoFolga } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando solicitação de folga na API...")

    const body = await request.json()
    console.log("[v0] Dados recebidos:", body)

    const { colaboradorId, dataFolga, motivo } = body

    if (!colaboradorId || !dataFolga) {
      console.log("[v0] Erro: Dados obrigatórios faltando")
      return NextResponse.json({ error: "Colaborador ID e data da folga são obrigatórios" }, { status: 400 })
    }

    // Verificar se a data não é no passado
    const hoje = new Date()
    const dataFolgaDate = new Date(dataFolga)

    if (dataFolgaDate <= hoje) {
      console.log("[v0] Erro: Data da folga é no passado")
      return NextResponse.json({ error: "A data da folga deve ser futura" }, { status: 400 })
    }

    try {
      console.log("[v0] Chamando createSolicitacaoFolga...")
      const solicitacao = await createSolicitacaoFolga(colaboradorId, dataFolga, motivo)
      console.log("[v0] Solicitação criada com sucesso:", solicitacao)

      return NextResponse.json({
        ok: true,
        solicitacao,
      })
    } catch (error: any) {
      console.log("[v0] Erro ao criar solicitação:", error)

      // Check if it's a cargo conflict error
      if (error.message && error.message.includes("já tem folga aprovada")) {
        console.log("[v0] Erro de conflito de cargo")
        return NextResponse.json(
          {
            error: error.message,
            type: "cargo_conflict",
          },
          { status: 409 },
        )
      }
      throw error // Re-throw if it's not a cargo conflict error
    }
  } catch (error) {
    console.error("[v0] Erro geral na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
