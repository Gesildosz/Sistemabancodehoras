import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] API logs chamada, URL:", request.url)

    const { searchParams } = new URL(request.url)
    const tipoAtividade = searchParams.get("tipo")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const pagina = Number.parseInt(searchParams.get("pagina") || "1")
    const limite = 50
    const offset = (pagina - 1) * limite

    console.log("[v0] Parâmetros:", { tipoAtividade, dataInicio, dataFim, pagina })

    try {
      await sql`SELECT COUNT(*) FROM logs_atividades LIMIT 1`
      console.log("[v0] Tabela logs_atividades existe")
    } catch (tableError) {
      console.error("[v0] Tabela logs_atividades não existe:", tableError)
      return NextResponse.json({
        logs: [],
        total: 0,
        dadosLog: {
          acessosHoje: 0,
          errosCodigo: 0,
          solicitacoes: 0,
          bloqueios: 0,
          atividadesPorHora: [],
          tiposAtividade: [],
        },
      })
    }

    console.log("[v0] Executando query de logs...")

    let logs: any[] = []

    if (tipoAtividade && dataInicio && dataFim) {
      logs = await sql`
        SELECT * FROM logs_atividades 
        WHERE tipo = ${tipoAtividade} 
        AND DATE(data_hora) >= ${dataInicio} 
        AND DATE(data_hora) <= ${dataFim}
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    } else if (tipoAtividade) {
      logs = await sql`
        SELECT * FROM logs_atividades 
        WHERE tipo = ${tipoAtividade}
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    } else if (dataInicio && dataFim) {
      logs = await sql`
        SELECT * FROM logs_atividades 
        WHERE DATE(data_hora) >= ${dataInicio} 
        AND DATE(data_hora) <= ${dataFim}
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    } else if (dataInicio) {
      logs = await sql`
        SELECT * FROM logs_atividades 
        WHERE DATE(data_hora) >= ${dataInicio}
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    } else if (dataFim) {
      logs = await sql`
        SELECT * FROM logs_atividades 
        WHERE DATE(data_hora) <= ${dataFim}
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    } else {
      logs = await sql`
        SELECT * FROM logs_atividades
        ORDER BY data_hora DESC
        LIMIT ${limite} OFFSET ${offset}
      `
    }

    console.log("[v0] Logs encontrados:", logs.length)

    let total = 0
    if (tipoAtividade && dataInicio && dataFim) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM logs_atividades 
        WHERE tipo = ${tipoAtividade} 
        AND DATE(data_hora) >= ${dataInicio} 
        AND DATE(data_hora) <= ${dataFim}
      `
      total = Number(countResult[0]?.total || 0)
    } else if (tipoAtividade) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM logs_atividades 
        WHERE tipo = ${tipoAtividade}
      `
      total = Number(countResult[0]?.total || 0)
    } else if (dataInicio && dataFim) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM logs_atividades 
        WHERE DATE(data_hora) >= ${dataInicio} 
        AND DATE(data_hora) <= ${dataFim}
      `
      total = Number(countResult[0]?.total || 0)
    } else {
      const countResult = await sql`SELECT COUNT(*) as total FROM logs_atividades`
      total = Number(countResult[0]?.total || 0)
    }

    const hoje = new Date().toISOString().split("T")[0]

    let acessosHoje = 0
    let errosCodigo = 0
    let solicitacoes = 0
    let bloqueios = 0

    try {
      const acessosResult = await sql`
        SELECT COUNT(*) as count
        FROM logs_atividades
        WHERE tipo = 'acesso' AND DATE(data_hora) = ${hoje} AND sucesso = true
      `
      acessosHoje = Number(acessosResult[0]?.count || 0)
    } catch (error) {
      console.error("[v0] Erro ao buscar acessos:", error)
    }

    try {
      const errosResult = await sql`
        SELECT COUNT(*) as count
        FROM logs_atividades
        WHERE tipo = 'erro_codigo' AND DATE(data_hora) = ${hoje}
      `
      errosCodigo = Number(errosResult[0]?.count || 0)
    } catch (error) {
      console.error("[v0] Erro ao buscar erros:", error)
    }

    try {
      const solicitacoesResult = await sql`
        SELECT COUNT(*) as count
        FROM logs_atividades
        WHERE tipo = 'solicitacao' AND DATE(data_hora) = ${hoje}
      `
      solicitacoes = Number(solicitacoesResult[0]?.count || 0)
    } catch (error) {
      console.error("[v0] Erro ao buscar solicitações:", error)
    }

    try {
      const bloqueiosResult = await sql`
        SELECT COUNT(*) as count
        FROM logs_atividades
        WHERE tipo = 'bloqueio' AND DATE(data_hora) = ${hoje}
      `
      bloqueios = Number(bloqueiosResult[0]?.count || 0)
    } catch (error) {
      console.error("[v0] Erro ao buscar bloqueios:", error)
    }

    let atividadesPorHora: any[] = []
    try {
      const atividadesResult = await sql`
        SELECT 
          EXTRACT(HOUR FROM data_hora)::integer as hora,
          COUNT(*) as total
        FROM logs_atividades
        WHERE data_hora >= NOW() - INTERVAL '24 hours'
        GROUP BY EXTRACT(HOUR FROM data_hora)
        ORDER BY hora
      `

      atividadesPorHora = atividadesResult.map((item: any) => ({
        hora: `${item.hora}:00`,
        acessos: 0, // Simplificado por enquanto
        erros: 0,
        total: Number(item.total || 0),
      }))
    } catch (error) {
      console.error("[v0] Erro ao buscar atividades por hora:", error)
      atividadesPorHora = []
    }

    let tiposAtividade: any[] = []
    try {
      const tiposResult = await sql`
        SELECT 
          tipo,
          COUNT(*) as value
        FROM logs_atividades
        WHERE data_hora >= NOW() - INTERVAL '7 days'
        GROUP BY tipo
        ORDER BY value DESC
      `

      const coresGrafico: Record<string, string> = {
        acesso: "#10b981",
        erro_codigo: "#ef4444",
        solicitacao: "#3b82f6",
        bloqueio: "#8b5cf6",
        desbloqueio: "#f59e0b",
        lancamento_horas: "#06b6d4",
      }

      tiposAtividade = tiposResult.map((item: any) => ({
        tipo: item.tipo,
        value: Number(item.value || 0),
        name: (item.tipo || "").replace("_", " ").toUpperCase(),
        fill: coresGrafico[item.tipo] || "#6b7280",
      }))
    } catch (error) {
      console.error("[v0] Erro ao buscar tipos de atividade:", error)
      tiposAtividade = []
    }

    return NextResponse.json({
      logs,
      total: Number(total),
      dadosLog: {
        acessosHoje,
        errosCodigo,
        solicitacoes,
        bloqueios,
        atividadesPorHora,
        tiposAtividade,
      },
    })
  } catch (error) {
    console.error("[v0] Erro detalhado na API logs:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
