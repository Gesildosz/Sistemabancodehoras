import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import * as XLSX from "xlsx"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando importação Excel")
    const formData = await request.formData()
    const arquivo = formData.get("arquivo") as File

    if (!arquivo) {
      console.log("[v0] Erro: Nenhum arquivo enviado")
      return NextResponse.json({ erro: "Nenhum arquivo foi enviado" }, { status: 400 })
    }

    console.log("[v0] Arquivo recebido:", arquivo.name, "Tamanho:", arquivo.size)

    // Verificar se é um arquivo Excel
    if (!arquivo.name.match(/\.(xlsx|xls)$/i)) {
      console.log("[v0] Erro: Formato inválido")
      return NextResponse.json({ erro: "Formato de arquivo inválido. Use apenas .xlsx ou .xls" }, { status: 400 })
    }

    // Ler o arquivo Excel
    console.log("[v0] Lendo arquivo Excel...")
    const buffer = await arquivo.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "buffer" })

    // Pegar a primeira planilha
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    console.log("[v0] Planilha encontrada:", sheetName)

    // Converter para JSON
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    console.log("[v0] Total de linhas no arquivo:", dados.length)

    if (dados.length < 2) {
      console.log("[v0] Erro: Arquivo muito pequeno")
      return NextResponse.json(
        { erro: "Arquivo Excel deve conter pelo menos uma linha de cabeçalho e uma linha de dados" },
        { status: 400 },
      )
    }

    // Verificar cabeçalho
    const cabecalho = dados[0].map((col) => String(col).toLowerCase().trim())
    console.log("[v0] Cabeçalho encontrado:", cabecalho)

    const colunasEsperadas = ["crachá", "nome completo", "cargo", "líder", "saldo final"]

    const colunasMapeadas = {
      cracha: -1,
      nome: -1,
      cargo: -1,
      lider: -1,
      saldo: -1,
    }

    // Mapear colunas
    cabecalho.forEach((col, index) => {
      if (col.includes("crachá") || col.includes("cracha")) colunasMapeadas.cracha = index
      else if (col.includes("nome")) colunasMapeadas.nome = index
      else if (col.includes("cargo")) colunasMapeadas.cargo = index
      else if (col.includes("líder") || col.includes("lider")) colunasMapeadas.lider = index
      else if (col.includes("saldo")) colunasMapeadas.saldo = index
    })

    console.log("[v0] Colunas mapeadas:", colunasMapeadas)

    // Verificar se todas as colunas foram encontradas
    const colunasFaltando = Object.entries(colunasMapeadas)
      .filter(([_, index]) => index === -1)
      .map(([nome]) => nome)

    if (colunasFaltando.length > 0) {
      console.log("[v0] Erro: Colunas faltando:", colunasFaltando)
      return NextResponse.json(
        {
          erro: `Colunas não encontradas: ${colunasFaltando.join(", ")}. Verifique o cabeçalho do arquivo.`,
          cabecalhoEncontrado: cabecalho,
          colunasEsperadas,
        },
        { status: 400 },
      )
    }

    let processados = 0
    let erros = 0
    const detalhes: string[] = []
    const detalhesProcessados: any[] = []
    const detalhesErros: any[] = []
    const linhasDados = dados.slice(1) // Pular cabeçalho

    console.log("[v0] Iniciando processamento de", linhasDados.length, "linhas")

    // Processar cada linha
    for (let i = 0; i < linhasDados.length; i++) {
      const linha = linhasDados[i]
      const numeroLinha = i + 2 // +2 porque começamos do índice 1 e pulamos o cabeçalho

      try {
        console.log(`[v0] Processando linha ${numeroLinha}:`, linha)

        const cracha = String(linha[colunasMapeadas.cracha] || "").trim()
        const nome = String(linha[colunasMapeadas.nome] || "").trim()
        const cargo = String(linha[colunasMapeadas.cargo] || "").trim()
        const lider = String(linha[colunasMapeadas.lider] || "").trim()
        const saldoFinal = String(linha[colunasMapeadas.saldo] || "").trim()

        console.log(`[v0] Dados extraídos - Crachá: ${cracha}, Nome: ${nome}, Saldo: ${saldoFinal}`)

        // Validações básicas
        if (!cracha) {
          console.log(`[v0] Erro linha ${numeroLinha}: Crachá vazio`)
          detalhes.push(`Linha ${numeroLinha}: Crachá não informado`)
          detalhesErros.push({
            linha: numeroLinha,
            erro: "Crachá não informado",
            dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
          })
          erros++
          continue
        }

        if (!nome) {
          console.log(`[v0] Erro linha ${numeroLinha}: Nome vazio`)
          detalhes.push(`Linha ${numeroLinha}: Nome não informado`)
          detalhesErros.push({
            linha: numeroLinha,
            erro: "Nome não informado",
            dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
          })
          erros++
          continue
        }

        if (!saldoFinal) {
          console.log(`[v0] Erro linha ${numeroLinha}: Saldo vazio`)
          detalhes.push(`Linha ${numeroLinha}: Saldo final não informado`)
          detalhesErros.push({
            linha: numeroLinha,
            erro: "Saldo final não informado",
            dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
          })
          erros++
          continue
        }

        let saldoMinutos = 0
        let isNegativo = false

        // Verificar se o saldo é negativo (tem sinal -)
        if (saldoFinal.startsWith("-")) {
          isNegativo = true
        }

        // Remover o sinal negativo para processamento
        const saldoLimpo = saldoFinal.replace("-", "").trim()

        // Tentar diferentes formatos de saldo
        if (saldoLimpo.includes(":")) {
          // Formato HH:MM
          const regexSaldo = /^(\d{1,3}):([0-5]\d)$/
          if (!regexSaldo.test(saldoLimpo)) {
            console.log(`[v0] Erro linha ${numeroLinha}: Formato de saldo inválido: ${saldoFinal}`)
            detalhes.push(`Linha ${numeroLinha}: Formato de saldo inválido. Use HH:MM (ex: 8:30 ou -8:30)`)
            detalhesErros.push({
              linha: numeroLinha,
              erro: "Formato de saldo inválido. Use HH:MM (ex: 8:30 ou -8:30)",
              dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
            })
            erros++
            continue
          }
          const [horas, minutos] = saldoLimpo.split(":").map(Number)
          saldoMinutos = horas * 60 + minutos
        } else {
          // Tentar como número decimal (ex: 8.5 = 8h30min ou -8.5 = -8h30min)
          const saldoDecimal = Number.parseFloat(saldoLimpo.replace(",", "."))
          if (isNaN(saldoDecimal)) {
            console.log(`[v0] Erro linha ${numeroLinha}: Saldo não é um número válido: ${saldoFinal}`)
            detalhes.push(
              `Linha ${numeroLinha}: Saldo deve ser no formato HH:MM ou decimal (ex: 8:30, -8:30, 8.5 ou -8.5)`,
            )
            detalhesErros.push({
              linha: numeroLinha,
              erro: "Saldo deve ser no formato HH:MM ou decimal (ex: 8:30, -8:30, 8.5 ou -8.5)",
              dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
            })
            erros++
            continue
          }
          saldoMinutos = Math.round(saldoDecimal * 60)
        }

        // Aplicar sinal negativo se necessário
        if (isNegativo) {
          saldoMinutos = -saldoMinutos
        }

        console.log(`[v0] Saldo convertido para minutos: ${saldoMinutos} (${isNegativo ? "NEGATIVO" : "POSITIVO"})`)

        // Verificar se o colaborador existe
        console.log(`[v0] Verificando se colaborador ${cracha} existe...`)
        const colaboradorExistente = await sql`
          SELECT id FROM colaboradores WHERE cracha = ${cracha}
        `

        if (colaboradorExistente.length === 0) {
          console.log(`[v0] Erro linha ${numeroLinha}: Colaborador ${cracha} não encontrado`)
          detalhes.push(`Linha ${numeroLinha}: Colaborador com crachá ${cracha} não encontrado`)
          detalhesErros.push({
            linha: numeroLinha,
            erro: `Colaborador com crachá ${cracha} não encontrado`,
            dados: { cracha, nome, cargo, lider, saldo: saldoFinal },
          })
          erros++
          continue
        }

        const colaboradorId = colaboradorExistente[0].id
        console.log(`[v0] Colaborador encontrado, ID: ${colaboradorId}`)

        console.log(`[v0] Inserindo lançamento de horas para colaborador ${colaboradorId}...`)
        await sql`
          INSERT INTO hora_lancamentos (colaborador_id, horas, data_lancamento, criado_em, motivo, criado_por)
          VALUES (${colaboradorId}, ${saldoMinutos}, NOW(), NOW(), ${`Importação Excel - ${arquivo.name}`}, 1)
        `

        console.log(`[v0] Registrando log de atividade...`)
        await sql`
          INSERT INTO logs_atividades (
            colaborador_id, tipo, descricao, data_hora, dados_extras, sucesso
          ) VALUES (
            ${colaboradorId}, 
            'IMPORTACAO_HORAS', 
            ${`Horas importadas via Excel: ${saldoFinal}`},
            NOW(),
            ${JSON.stringify({
              arquivo: arquivo.name,
              saldo_anterior: null,
              saldo_novo: saldoFinal,
              cargo,
              lider,
            })},
            true
          )
        `

        processados++
        console.log(`[v0] Linha ${numeroLinha} processada com sucesso`)
        detalhes.push(
          `Linha ${numeroLinha}: ${nome} (${cracha}) - Saldo atualizado para ${saldoFinal} (${saldoMinutos > 0 ? "positivo" : "negativo"})`,
        )
        detalhesProcessados.push({
          linha: numeroLinha,
          cracha,
          nome,
          cargo,
          lider,
          saldo: saldoFinal,
          saldoMinutos,
          status: "Processado com sucesso",
        })
      } catch (error) {
        console.error(`[v0] Erro ao processar linha ${numeroLinha}:`, error)
        detalhes.push(
          `Linha ${numeroLinha}: Erro interno - ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        )
        detalhesErros.push({
          linha: numeroLinha,
          erro: `Erro interno - ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          dados: linha,
        })
        erros++
      }
    }

    console.log(`[v0] Processamento concluído: ${processados} sucessos, ${erros} erros`)

    // Registrar atividade do administrador
    await sql`
      INSERT INTO logs_atividades (
        tipo, descricao, data_hora, dados_extras, sucesso
      ) VALUES (
        'ADMIN_IMPORTACAO_EXCEL',
        ${`Importação de horas via Excel: ${processados} processados, ${erros} erros`},
        NOW(),
        ${JSON.stringify({
          arquivo: arquivo.name,
          total_linhas: linhasDados.length,
          processados,
          erros,
          detalhes: detalhes.slice(0, 10), // Limitar detalhes no log
        })},
        ${processados > 0}
      )
    `

    return NextResponse.json({
      sucesso: processados > 0,
      total: linhasDados.length,
      processados,
      erros,
      detalhes: detalhes.slice(0, 20), // Limitar detalhes na resposta
      detalhesProcessados,
      detalhesErros,
      mensagem: `Importação concluída: ${processados} registros processados, ${erros} erros`,
    })
  } catch (error) {
    console.error("[v0] Erro geral ao processar arquivo Excel:", error)

    // Registrar erro no log
    try {
      await sql`
        INSERT INTO logs_atividades (
          tipo, descricao, data_hora, dados_extras, sucesso
        ) VALUES (
          'ADMIN_ERRO_IMPORTACAO',
          'Erro ao importar arquivo Excel',
          NOW(),
          ${JSON.stringify({ erro: error instanceof Error ? error.message : "Erro desconhecido" })},
          false
        )
      `
    } catch (logError) {
      console.error("[v0] Erro ao registrar log:", logError)
    }

    return NextResponse.json(
      {
        erro: "Erro interno do servidor ao processar arquivo Excel",
        detalhes: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
