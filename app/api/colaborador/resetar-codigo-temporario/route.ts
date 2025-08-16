import { NextResponse } from "next/server"
import { sql, registrarAcao } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { colaboradorId } = await request.json()

    if (!colaboradorId) {
      return NextResponse.json({ ok: false, error: "ID do colaborador é obrigatório" }, { status: 400 })
    }

    const novoCodigoTemporario = Math.floor(100000 + Math.random() * 900000).toString()

    await sql`
      UPDATE colaboradores 
      SET codigo_temporario = ${novoCodigoTemporario},
          codigo_temporario_usado = FALSE,
          atualizado_em = NOW()
      WHERE id = ${colaboradorId}
    `

    try {
      await registrarAcao({
        colaboradorId,
        acao: "codigo_temporario_resetado",
        detalhes: "Código temporário foi resetado pelo usuário",
        executadoPor: "Sistema",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })
    } catch (historyError) {
      console.error("Erro ao registrar histórico:", historyError)
      // Continue mesmo se falhar o histórico
    }

    return NextResponse.json({
      ok: true,
      novoCodigoTemporario,
      message: "Código temporário resetado com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao resetar código temporário:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno do servidor. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
