import { NextResponse } from "next/server"
import { verificarCodigoTemporario, registrarAcao } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { colaboradorId, codigoTemporario } = await request.json()

    if (!colaboradorId || !codigoTemporario) {
      return NextResponse.json({ ok: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    console.log("[v0] Verificando código temporário:", { colaboradorId, codigoDigitado: codigoTemporario })

    const colaborador = await verificarCodigoTemporario(colaboradorId, codigoTemporario)

    if (colaborador) {
      console.log("[v0] Código temporário válido para colaborador:", colaborador.nome)

      await registrarAcao({
        colaboradorId: colaborador.id,
        acao: "login_temporario",
        detalhes: "Login realizado com código temporário",
        executadoPor: "Sistema",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      })

      return NextResponse.json({
        ok: true,
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        precisaCadastrarCodigoFixo: true,
      })
    } else {
      console.log("[v0] Código temporário inválido ou colaborador não encontrado")
      return NextResponse.json({ ok: false, error: "Código temporário inválido ou já utilizado" }, { status: 401 })
    }
  } catch (error) {
    console.error("Erro ao verificar código temporário:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
