import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando geração de PIN de desbloqueio")

    const { colaboradorId, cracha } = await request.json()
    console.log("[v0] Dados recebidos:", { colaboradorId, cracha })

    if (!colaboradorId) {
      return NextResponse.json({ error: "Colaborador ID é obrigatório" }, { status: 400 })
    }

    // Gerar PIN de 6 dígitos
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("[v0] PIN gerado:", pin)

    // Verificar se colaborador existe
    const colaborador = await sql`
      SELECT id, nome, cracha FROM colaboradores 
      WHERE id = ${colaboradorId}
    `

    if (colaborador.length === 0) {
      console.log("[v0] Colaborador não encontrado:", colaboradorId)
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    console.log("[v0] Colaborador encontrado:", colaborador[0])

    // Remover PINs antigos do mesmo colaborador
    await sql`
      DELETE FROM pins_desbloqueio 
      WHERE colaborador_id = ${colaboradorId}
    `

    // Inserir novo PIN na tabela de desbloqueios
    const result = await sql`
      INSERT INTO pins_desbloqueio (
        colaborador_id, 
        pin, 
        usado, 
        criado_em, 
        data_criacao, 
        data_expiracao,
        ip_address,
        user_agent
      )
      VALUES (
        ${colaboradorId}, 
        ${pin}, 
        false,
        NOW(),
        NOW(),
        NOW() + INTERVAL '24 hours',
        ${request.ip || "unknown"},
        ${request.headers.get("user-agent") || "unknown"}
      )
      RETURNING id
    `

    console.log("[v0] PIN inserido com sucesso:", result[0])

    // Registrar no histórico
    await sql`
      INSERT INTO historico_acoes (colaborador_id, acao, detalhes, data_acao, executado_por)
      VALUES (
        ${colaboradorId}, 
        'PIN_DESBLOQUEIO_GERADO', 
        'PIN de desbloqueio gerado automaticamente após 3 tentativas incorretas', 
        NOW(),
        'Sistema'
      )
    `

    console.log("[v0] PIN gerado com sucesso para colaborador:", colaboradorId)

    return NextResponse.json({
      ok: true,
      pin: pin,
      message: "PIN de desbloqueio gerado com sucesso",
      colaborador: colaborador[0],
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar PIN de desbloqueio:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
