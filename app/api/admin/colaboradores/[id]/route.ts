import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// PUT - Atualizar colaborador
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)
    const body = await request.json()
    const { nome, cracha, dataNascimento, cargo, supervisor, turno, telefone } = body

    // Verificar se o colaborador existe
    const colaboradorExistente = await sql`
      SELECT id FROM colaboradores WHERE id = ${colaboradorId}
    `

    if (colaboradorExistente.length === 0) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    // Verificar se o crachá já existe em outro colaborador
    const crachaExistente = await sql`
      SELECT id FROM colaboradores 
      WHERE cracha = ${cracha} AND id != ${colaboradorId}
    `

    if (crachaExistente.length > 0) {
      return NextResponse.json({ error: "Já existe um colaborador com este crachá" }, { status: 400 })
    }

    // Atualizar colaborador
    await sql`
      UPDATE colaboradores 
      SET 
        nome = ${nome},
        cracha = ${cracha},
        data_nascimento = ${dataNascimento},
        cargo = ${cargo},
        supervisor = ${supervisor},
        turno = ${turno},
        telefone = ${telefone}
      WHERE id = ${colaboradorId}
    `

    return NextResponse.json({
      message: "Colaborador atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Excluir colaborador
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)

    // Verificar se o colaborador existe
    const colaboradorExistente = await sql`
      SELECT nome FROM colaboradores WHERE id = ${colaboradorId}
    `

    if (colaboradorExistente.length === 0) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    // Excluir registros relacionados primeiro (devido às foreign keys)
    await sql`DELETE FROM hora_lancamentos WHERE colaborador_id = ${colaboradorId}`
    await sql`DELETE FROM solicitacoes_folga WHERE colaborador_id = ${colaboradorId}`
    await sql`DELETE FROM historico_acoes WHERE colaborador_id = ${colaboradorId}`
    await sql`DELETE FROM notificacoes WHERE colaborador_id = ${colaboradorId}`
    await sql`DELETE FROM solicitacoes_recuperacao WHERE colaborador_id = ${colaboradorId}`
    await sql`DELETE FROM pins_desbloqueio WHERE colaborador_id = ${colaboradorId}`

    // Excluir o colaborador
    await sql`DELETE FROM colaboradores WHERE id = ${colaboradorId}`

    return NextResponse.json({
      message: "Colaborador excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir colaborador:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
