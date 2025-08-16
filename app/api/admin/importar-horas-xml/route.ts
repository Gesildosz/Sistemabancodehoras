import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const arquivo = formData.get("arquivo") as File

    if (!arquivo) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    if (!arquivo.name.endsWith(".xml")) {
      return NextResponse.json({ error: "Arquivo deve ser do tipo XML" }, { status: 400 })
    }

    // Ler conteúdo do arquivo XML
    const conteudoXML = await arquivo.text()

    // Parse básico do XML (assumindo estrutura simples)
    const registros = parseXMLHoras(conteudoXML)

    if (registros.length === 0) {
      return NextResponse.json({ error: "Nenhum registro válido encontrado no XML" }, { status: 400 })
    }

    let processados = 0
    let atualizados = 0
    let erros = 0

    // Processar cada registro
    for (const registro of registros) {
      try {
        processados++

        // Buscar colaborador pelo crachá
        const colaborador = await sql`
          SELECT id, nome, saldo_horas 
          FROM colaboradores 
          WHERE cracha = ${registro.cracha}
        `

        if (colaborador.length === 0) {
          console.log(`Colaborador com crachá ${registro.cracha} não encontrado`)
          erros++
          continue
        }

        const colaboradorId = colaborador[0].id
        const saldoAtual = colaborador[0].saldo_horas || 0
        const novoSaldo = registro.saldoFinal

        // Calcular diferença para lançamento
        const diferencaHoras = novoSaldo - saldoAtual

        if (diferencaHoras !== 0) {
          // Inserir lançamento de horas
          await sql`
            INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por, data_criacao)
            VALUES (${colaboradorId}, ${diferencaHoras}, ${"Importação XML - Ajuste de saldo"}, ${"Sistema"}, NOW())
          `

          // Atualizar saldo do colaborador
          await sql`
            UPDATE colaboradores 
            SET saldo_horas = ${novoSaldo}
            WHERE id = ${colaboradorId}
          `

          // Registrar no log de atividades
          await sql`
            INSERT INTO logs_atividades (tipo, colaborador_id, descricao, data_hora, dados_extras, sucesso)
            VALUES ('IMPORTACAO_XML', ${colaboradorId}, ${`Saldo atualizado via XML: ${saldoAtual} → ${novoSaldo} (${diferencaHoras > 0 ? "+" : ""}${diferencaHoras}h)`}, NOW(), ${JSON.stringify({ saldo_anterior: saldoAtual, saldo_novo: novoSaldo, diferenca: diferencaHoras })}, true)
          `

          atualizados++
        }
      } catch (error) {
        console.error(`Erro ao processar registro ${registro.cracha}:`, error)
        erros++
      }
    }

    return NextResponse.json({
      success: true,
      processados,
      atualizados,
      erros,
      message: `Importação concluída: ${processados} processados, ${atualizados} atualizados, ${erros} erros`,
    })
  } catch (error) {
    console.error("Erro na importação XML:", error)
    return NextResponse.json({ error: "Erro interno do servidor ao processar XML" }, { status: 500 })
  }
}

// Função para fazer parse básico do XML
function parseXMLHoras(xmlContent: string) {
  const registros: Array<{
    cracha: string
    nomeCompleto: string
    cargo: string
    lider: string
    saldoFinal: number
  }> = []

  try {
    // Parse simples assumindo estrutura XML básica
    // Procurar por tags de colaborador ou registro
    const colaboradorRegex = /<(?:colaborador|registro)[^>]*>(.*?)<\/(?:colaborador|registro)>/gs
    const matches = xmlContent.match(colaboradorRegex)

    if (matches) {
      matches.forEach((match) => {
        const cracha = extractXMLValue(match, "cracha") || extractXMLValue(match, "Cracha")
        const nomeCompleto =
          extractXMLValue(match, "nome") ||
          extractXMLValue(match, "NomeCompleto") ||
          extractXMLValue(match, "nome_completo")
        const cargo = extractXMLValue(match, "cargo") || extractXMLValue(match, "Cargo")
        const lider = extractXMLValue(match, "lider") || extractXMLValue(match, "Lider")
        const saldoFinalStr =
          extractXMLValue(match, "saldo_final") ||
          extractXMLValue(match, "SaldoFinal") ||
          extractXMLValue(match, "saldo")

        if (cracha && saldoFinalStr) {
          const saldoFinal = Number.parseFloat(saldoFinalStr.replace(",", "."))
          if (!isNaN(saldoFinal)) {
            registros.push({
              cracha,
              nomeCompleto: nomeCompleto || "",
              cargo: cargo || "",
              lider: lider || "",
              saldoFinal,
            })
          }
        }
      })
    }

    // Fallback: tentar parse linha por linha se não encontrou estrutura XML
    if (registros.length === 0) {
      const linhas = xmlContent.split("\n")
      for (const linha of linhas) {
        if (linha.includes("cracha") || linha.includes("Cracha")) {
          const cracha = extractXMLValue(linha, "cracha") || extractXMLValue(linha, "Cracha")
          const saldoFinalStr = extractXMLValue(linha, "saldo_final") || extractXMLValue(linha, "SaldoFinal")

          if (cracha && saldoFinalStr) {
            const saldoFinal = Number.parseFloat(saldoFinalStr.replace(",", "."))
            if (!isNaN(saldoFinal)) {
              registros.push({
                cracha,
                nomeCompleto: extractXMLValue(linha, "nome") || "",
                cargo: extractXMLValue(linha, "cargo") || "",
                lider: extractXMLValue(linha, "lider") || "",
                saldoFinal,
              })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao fazer parse do XML:", error)
  }

  return registros
}

// Função auxiliar para extrair valores de tags XML
function extractXMLValue(xmlString: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, "i")
  const match = xmlString.match(regex)
  return match ? match[1].trim() : null
}
