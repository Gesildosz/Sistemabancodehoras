import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, codigoAcesso } = await request.json()

    console.log("[v0] Verificando código fixo:", { colaboradorId, codigoDigitado: codigoAcesso })

    if (!colaboradorId || !codigoAcesso) {
      return NextResponse.json(
        { ok: false, error: "Colaborador ID e código de acesso são obrigatórios" },
        { status: 400 },
      )
    }

    const colaborador = await db.findColaboradorById(colaboradorId)

    if (!colaborador) {
      console.log("[v0] Colaborador não encontrado:", colaboradorId)
      return NextResponse.json({ ok: false, error: "Colaborador não encontrado" }, { status: 404 })
    }

    console.log("[v0] Colaborador encontrado:", {
      nome: colaborador.nome,
      bloqueado: colaborador.bloqueado,
      tentativas: colaborador.tentativas_codigo,
      codigoCorreto: colaborador.codigo_acesso === codigoAcesso,
    })

    // Check if colaborador is blocked
    if (colaborador.bloqueado) {
      console.log("[v0] Colaborador bloqueado, token:", colaborador.ultimo_token_bloqueio)
      return NextResponse.json(
        {
          ok: false,
          error: "Acesso bloqueado. Procure o administrador.",
          token: colaborador.ultimo_token_bloqueio,
          tokenDesbloqueio: colaborador.ultimo_token_bloqueio, // Adicionando tokenDesbloqueio para compatibilidade
        },
        { status: 403 },
      )
    }

    // Check if code is correct
    if (colaborador.codigo_acesso === codigoAcesso) {
      console.log("[v0] Código correto, resetando tentativas")
      await db.updateTentativas(colaboradorId, 0)

      return NextResponse.json({
        ok: true,
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
      })
    } else {
      // Increment attempts
      const novasTentativas = (colaborador.tentativas_codigo || 0) + 1
      console.log("[v0] Código incorreto, tentativas:", novasTentativas)

      if (novasTentativas >= 3) {
        // Block user and generate token
        const token = crypto.randomBytes(4).toString("hex").toUpperCase()
        console.log("[v0] Bloqueando usuário, token gerado:", token)

        await db.updateTentativas(colaboradorId, novasTentativas)
        await db.blockColaborador(colaboradorId, token)

        return NextResponse.json(
          {
            ok: false,
            error: "Código errado 3 vezes. Procure o administrador e informe o token.",
            token,
            tokenDesbloqueio: token, // Adicionando tokenDesbloqueio para compatibilidade
          },
          { status: 403 },
        )
      } else {
        await db.updateTentativas(colaboradorId, novasTentativas)

        return NextResponse.json(
          {
            ok: false,
            error: `Código de acesso incorreto. Tentativa ${novasTentativas}/3`,
          },
          { status: 401 },
        )
      }
    }
  } catch (error) {
    console.error("Erro ao verificar código:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
