import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { db } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { acao, motivo, adminId, resetarCodigo } = await request.json()
    const solicitacaoId = Number.parseInt(params.id)

    if (!acao || !adminId) {
      return NextResponse.json({ ok: false, error: "Ação e ID do administrador são obrigatórios" }, { status: 400 })
    }

    if (acao === "aprovar") {
      // Get solicitacao details
      const solicitacao = await sql`
        SELECT colaborador_id FROM solicitacoes_recuperacao WHERE id = ${solicitacaoId}
      `

      if (solicitacao.length === 0) {
        return NextResponse.json({ ok: false, error: "Solicitação não encontrada" }, { status: 404 })
      }

      const colaboradorId = solicitacao[0].colaborador_id

      await sql`
        UPDATE colaboradores 
        SET codigo_acesso = NULL,
            tentativas_codigo = 0,
            bloqueado = FALSE,
            ultimo_token_bloqueio = NULL,
            atualizado_em = NOW()
        WHERE id = ${colaboradorId}
      `

      // Update solicitacao as approved
      await sql`
        UPDATE solicitacoes_recuperacao 
        SET status = 'aprovada',
            aprovada_por = ${adminId},
            processada_em = NOW()
        WHERE id = ${solicitacaoId}
      `

      // Register action
      await db.registrarAcao({
        colaboradorId,
        acao: "recuperacao_aprovada",
        detalhes: `Solicitação de recuperação aprovada. Código de acesso resetado - colaborador deve criar novo código no próximo login.`,
        executadoPor: `Admin ID: ${adminId}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      return NextResponse.json({
        ok: true,
        message: "Solicitação aprovada! O colaborador deve criar um novo código de acesso no próximo login.",
      })
    } else if (acao === "recusar") {
      // Get solicitacao details
      const solicitacao = await sql`
        SELECT colaborador_id FROM solicitacoes_recuperacao WHERE id = ${solicitacaoId}
      `

      if (solicitacao.length === 0) {
        return NextResponse.json({ ok: false, error: "Solicitação não encontrada" }, { status: 404 })
      }

      const colaboradorId = solicitacao[0].colaborador_id

      // Update solicitacao as rejected
      await sql`
        UPDATE solicitacoes_recuperacao 
        SET status = 'recusada',
            aprovada_por = ${adminId},
            motivo_recusa = ${motivo || "Não especificado"},
            processada_em = NOW()
        WHERE id = ${solicitacaoId}
      `

      // Register action
      await db.registrarAcao({
        colaboradorId,
        acao: "recuperacao_recusada",
        detalhes: `Solicitação de recuperação recusada. Motivo: ${motivo || "Não especificado"}`,
        executadoPor: `Admin ID: ${adminId}`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      return NextResponse.json({ ok: true, message: "Solicitação recusada com sucesso!" })
    }

    return NextResponse.json({ ok: false, error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao processar solicitação:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
