import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Buscando status de manutenção")

    const result = await sql`
      SELECT ativo, mensagem, data_inicio, data_fim, atualizado_em
      FROM manutencao_sistema 
      ORDER BY id DESC 
      LIMIT 1
    `

    const status = result[0] || { ativo: false, mensagem: "Sistema em manutenção. Tente novamente mais tarde." }

    console.log("[v0] Status de manutenção:", status)

    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error("[v0] Erro ao buscar status de manutenção:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ativo, mensagem, criadoPor } = await request.json()

    console.log("[v0] Atualizando status de manutenção:", { ativo, mensagem, criadoPor })

    if (typeof ativo !== "boolean") {
      return NextResponse.json({ success: false, error: "Status ativo deve ser boolean" }, { status: 400 })
    }

    const dataAtual = new Date().toISOString()

    // Atualizar ou inserir status de manutenção
    await sql`
      INSERT INTO manutencao_sistema (ativo, mensagem, criado_por, data_inicio, data_fim, atualizado_em)
      VALUES (
        ${ativo}, 
        ${mensagem || "Sistema em manutenção. Tente novamente mais tarde."}, 
        ${criadoPor || "ADMIN"}, 
        ${ativo ? dataAtual : null},
        ${!ativo ? dataAtual : null},
        ${dataAtual}
      )
      ON CONFLICT (id) DO UPDATE SET
        ativo = EXCLUDED.ativo,
        mensagem = EXCLUDED.mensagem,
        data_inicio = CASE WHEN EXCLUDED.ativo = true THEN EXCLUDED.data_inicio ELSE manutencao_sistema.data_inicio END,
        data_fim = CASE WHEN EXCLUDED.ativo = false THEN EXCLUDED.data_fim ELSE null END,
        atualizado_em = EXCLUDED.atualizado_em
    `

    // Se não há conflito, fazer update na primeira linha
    await sql`
      UPDATE manutencao_sistema 
      SET 
        ativo = ${ativo},
        mensagem = ${mensagem || "Sistema em manutenção. Tente novamente mais tarde."},
        data_inicio = ${ativo ? dataAtual : null},
        data_fim = ${!ativo ? dataAtual : null},
        atualizado_em = ${dataAtual}
      WHERE id = (SELECT MIN(id) FROM manutencao_sistema)
    `

    console.log("[v0] Status de manutenção atualizado com sucesso")

    return NextResponse.json({
      success: true,
      message: `Manutenção ${ativo ? "ativada" : "desativada"} com sucesso`,
    })
  } catch (error) {
    console.error("[v0] Erro ao atualizar status de manutenção:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
