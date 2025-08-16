import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando busca de dados de análise...")

    // Buscar saldo total de horas de todos os colaboradores com informações pessoais
    const resultadoSaldos = await sql`
      SELECT 
        c.id,
        c.nome,
        c.cracha,
        COALESCE(SUM(h.horas), 0) as saldo_total
      FROM colaboradores c
      LEFT JOIN hora_lancamentos h ON c.id = h.colaborador_id
      GROUP BY c.id, c.nome, c.cracha
      ORDER BY c.nome
    `

    console.log("Saldos encontrados:", resultadoSaldos.length)

    let horasPositivas = 0
    let horasNegativas = 0
    let colaboradoresPositivos = 0
    let colaboradoresNegativos = 0

    // Processar os saldos e preparar dados detalhados
    const colaboradoresDetalhados = resultadoSaldos.map((colaborador) => {
      const saldoTotal = Number.parseFloat(colaborador.saldo_total) || 0

      if (saldoTotal > 0) {
        horasPositivas += saldoTotal
        colaboradoresPositivos++
      } else if (saldoTotal < 0) {
        horasNegativas += saldoTotal
        colaboradoresNegativos++
      }

      return {
        id: colaborador.id,
        nome: colaborador.nome,
        cracha: colaborador.cracha,
        saldoHoras: Math.round(saldoTotal * 100) / 100,
      }
    })

    const totalColaboradores = colaboradoresPositivos + colaboradoresNegativos

    const dadosAnalise = {
      horasPositivas: Math.round(horasPositivas * 100) / 100,
      horasNegativas: Math.round(horasNegativas * 100) / 100,
      totalColaboradores,
      colaboradoresPositivos,
      colaboradoresNegativos,
      colaboradoresDetalhados,
    }

    console.log("Dados de análise processados:", dadosAnalise)

    return NextResponse.json(dadosAnalise)
  } catch (error) {
    console.error("Erro ao buscar dados de análise:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
