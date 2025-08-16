import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    if (!tipo) {
      return NextResponse.json({ error: "Tipo não especificado" }, { status: 400 })
    }

    const query = ""
    let colaboradores: any[] = []

    switch (tipo) {
      case "horasPositivas":
        colaboradores = await sql`
          SELECT c.cracha, c.nome, 
                 COALESCE(SUM(hl.horas), 0) as horas
          FROM colaboradores c
          LEFT JOIN hora_lancamentos hl ON c.id = hl.colaborador_id
          GROUP BY c.cracha, c.nome
          HAVING COALESCE(SUM(hl.horas), 0) > 0
          ORDER BY horas DESC
        `
        break

      case "horasNegativas":
        colaboradores = await sql`
          SELECT c.cracha, c.nome, 
                 COALESCE(SUM(hl.horas), 0) as horas
          FROM colaboradores c
          LEFT JOIN hora_lancamentos hl ON c.id = hl.colaborador_id
          GROUP BY c.cracha, c.nome
          HAVING COALESCE(SUM(hl.horas), 0) < 0
          ORDER BY horas ASC
        `
        break

      case "colabPositivos":
        colaboradores = await sql`
          SELECT c.cracha, c.nome, 
                 COALESCE(SUM(hl.horas), 0) as horas
          FROM colaboradores c
          LEFT JOIN hora_lancamentos hl ON c.id = hl.colaborador_id
          GROUP BY c.cracha, c.nome
          HAVING COALESCE(SUM(hl.horas), 0) > 0
          ORDER BY c.nome
        `
        break

      case "colabNegativos":
        colaboradores = await sql`
          SELECT c.cracha, c.nome, 
                 COALESCE(SUM(hl.horas), 0) as horas
          FROM colaboradores c
          LEFT JOIN hora_lancamentos hl ON c.id = hl.colaborador_id
          GROUP BY c.cracha, c.nome
          HAVING COALESCE(SUM(hl.horas), 0) < 0
          ORDER BY c.nome
        `
        break

      default:
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    const colaboradoresFormatados = colaboradores.map((c) => ({
      cracha: c.cracha,
      nome: c.nome,
      horas: Number(c.horas),
      status: Number(c.horas) >= 0 ? "positivo" : "negativo",
    }))

    return NextResponse.json({
      ok: true,
      colaboradores: colaboradoresFormatados,
    })
  } catch (error) {
    console.error("Erro ao buscar colaboradores por categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
