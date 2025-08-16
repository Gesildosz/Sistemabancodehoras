import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("Buscando solicitações de recuperação...")

    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'solicitacoes_recuperacao'
      )
    `

    console.log("Tabela existe:", tableExists[0].exists)

    if (!tableExists[0].exists) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tabela solicitacoes_recuperacao não existe",
        },
        { status: 500 },
      )
    }

    const solicitacoes = await sql`
      SELECT 
        sr.id,
        sr.colaborador_id,
        c.nome as colaborador_nome,
        c.cracha,
        sr.nome_completo,
        sr.cargo,
        sr.empresa,
        sr.nome_supervisor,
        sr.status,
        sr.motivo_recusa,
        sr.criada_em,
        sr.processada_em,
        a.nome_completo as aprovada_por_nome
      FROM solicitacoes_recuperacao sr
      JOIN colaboradores c ON sr.colaborador_id = c.id
      LEFT JOIN administradores a ON sr.aprovada_por = a.id
      ORDER BY sr.criada_em DESC
    `

    console.log("Solicitações encontradas:", solicitacoes.length)
    return NextResponse.json({ ok: true, solicitacoes })
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno do servidor: " + error.message,
      },
      { status: 500 },
    )
  }
}
