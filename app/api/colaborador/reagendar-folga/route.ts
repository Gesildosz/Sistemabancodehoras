import { NextResponse } from "next/server"
import { reagendarSolicitacaoFolga, registrarAcao } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { solicitacaoId, novaDataFolga, novoMotivo } = await request.json()

    if (!solicitacaoId || !novaDataFolga) {
      return NextResponse.json({ ok: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const resultado = await reagendarSolicitacaoFolga(solicitacaoId, novaDataFolga, novoMotivo)

    if (resultado.success) {
      // Registrar ação no histórico
      await registrarAcao({
        colaboradorId: resultado.colaboradorId,
        acao: "reagendamento_folga",
        detalhes: `Folga reagendada para ${new Date(novaDataFolga).toLocaleDateString("pt-BR")}`,
        executadoPor: "colaborador",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      return NextResponse.json({
        ok: true,
        message: "Folga reagendada com sucesso",
      })
    } else {
      return NextResponse.json({ ok: false, error: resultado.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Error reagendando folga:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
