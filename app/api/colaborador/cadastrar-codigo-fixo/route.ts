import { NextResponse } from "next/server"
import { cadastrarCodigoFixo, registrarAcao } from "@/lib/database"

export async function POST(request: Request) {
  try {
    console.log("[v0] Iniciando cadastro de código fixo...")

    const { colaboradorId, novoCodigoFixo } = await request.json()
    console.log("[v0] Dados recebidos:", { colaboradorId, codigoLength: novoCodigoFixo?.length })

    if (!colaboradorId || !novoCodigoFixo) {
      console.log("[v0] Erro: Campos obrigatórios faltando")
      return NextResponse.json({ ok: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (novoCodigoFixo.length < 4) {
      console.log("[v0] Erro: Código muito curto")
      return NextResponse.json({ ok: false, error: "O código deve ter pelo menos 4 caracteres" }, { status: 400 })
    }

    console.log("[v0] Chamando cadastrarCodigoFixo...")
    await cadastrarCodigoFixo(colaboradorId, novoCodigoFixo)
    console.log("[v0] Código cadastrado com sucesso")

    console.log("[v0] Registrando ação no histórico...")
    await registrarAcao({
      colaboradorId,
      acao: "codigo_fixo_cadastrado",
      detalhes: "Código de acesso fixo cadastrado pelo usuário",
      executadoPor: "Sistema",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    })
    console.log("[v0] Ação registrada com sucesso")

    console.log("[v0] Cadastro de código finalizado com sucesso")
    return NextResponse.json({
      ok: true,
      message: "Código de acesso fixo cadastrado com sucesso!",
    })
  } catch (error) {
    console.error("[v0] Erro ao cadastrar código fixo:", error)
    console.error("[v0] Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
