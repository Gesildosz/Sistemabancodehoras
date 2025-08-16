import { NextResponse } from "next/server"
import { cancelarSolicitacaoFolga, registrarAcao } from "@/lib/database"

export async function POST(request: Request) {
  try {
    console.log("[v0] Iniciando cancelamento de folga na API...")

    const { solicitacaoId, motivoCancelamento } = await request.json()
    console.log("[v0] Dados recebidos:", { solicitacaoId, motivoCancelamento })

    if (!solicitacaoId || !motivoCancelamento) {
      console.log("[v0] Erro: Campos obrigatórios faltando")
      return NextResponse.json({ ok: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Chamando cancelarSolicitacaoFolga...")
    const resultado = await cancelarSolicitacaoFolga(solicitacaoId, motivoCancelamento)
    console.log("[v0] Resultado do cancelamento:", resultado)

    if (resultado.success) {
      console.log("[v0] Cancelamento bem-sucedido, registrando ação...")
      // Registrar ação no histórico
      await registrarAcao({
        colaboradorId: resultado.colaboradorId!,
        acao: "cancelamento_folga",
        detalhes: `Folga cancelada. Motivo: ${motivoCancelamento}`,
        executadoPor: "colaborador",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      console.log("[v0] Ação registrada com sucesso")
      return NextResponse.json({
        ok: true,
        message: "Folga cancelada com sucesso",
      })
    } else {
      console.log("[v0] Erro no cancelamento:", resultado.error)
      return NextResponse.json({ ok: false, error: resultado.error }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error canceling leave:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
