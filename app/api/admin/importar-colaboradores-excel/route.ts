import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import * as XLSX from "xlsx"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando importação de colaboradores Excel")

    const formData = await request.formData()
    const arquivo = formData.get("arquivo") as File

    if (!arquivo) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    console.log("[v0] Arquivo recebido:", arquivo.name, "Tamanho:", arquivo.size)

    // Ler arquivo Excel
    const buffer = await arquivo.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const dados = XLSX.utils.sheet_to_json(worksheet)

    console.log("[v0] Dados extraídos do Excel:", dados.length, "linhas")

    let processados = 0
    let erros = 0
    const detalhes: string[] = []
    const detalhesProcessados: any[] = []
    const detalhesErros: any[] = []

    for (let i = 0; i < dados.length; i++) {
      const linha = dados[i] as any
      const numeroLinha = i + 2 // +2 porque Excel começa em 1 e tem cabeçalho

      try {
        console.log(`[v0] Processando linha ${numeroLinha}:`, linha)

        const camposObrigatorios = ["Crachá", "Nome"]

        // Normalizar nomes das colunas (remover espaços extras)
        const linhaNormalizada: any = {}
        Object.keys(linha).forEach((key) => {
          const keyNormalizada = key.trim()
          linhaNormalizada[keyNormalizada] = linha[key]
        })

        const camposFaltando = camposObrigatorios.filter((campo) => !linhaNormalizada[campo])

        if (camposFaltando.length > 0) {
          throw new Error(`Campos obrigatórios faltando: ${camposFaltando.join(", ")}`)
        }

        // Verificar se colaborador já existe
        const colaboradorExistente = await sql`
          SELECT id FROM colaboradores WHERE cracha = ${linhaNormalizada["Crachá"]}
        `

        if (colaboradorExistente.length > 0) {
          await sql`
            UPDATE colaboradores 
            SET 
              nome = ${linhaNormalizada["Nome"]},
              cargo = ${linhaNormalizada["Cargo"] || null},
              atualizado_em = NOW()
            WHERE cracha = ${linhaNormalizada["Crachá"]}
          `
          detalhes.push(`Linha ${numeroLinha}: Colaborador ${linhaNormalizada["Crachá"]} atualizado`)
          detalhesProcessados.push({
            linha: numeroLinha,
            cracha: linhaNormalizada["Crachá"],
            nome: linhaNormalizada["Nome"],
            acao: "Atualizado",
          })
        } else {
          await sql`
            INSERT INTO colaboradores (
              cracha, nome, cargo, criado_em
            ) VALUES (
              ${linhaNormalizada["Crachá"]}, ${linhaNormalizada["Nome"]}, 
              ${linhaNormalizada["Cargo"] || null}, NOW()
            )
          `
          detalhes.push(`Linha ${numeroLinha}: Novo colaborador ${linhaNormalizada["Crachá"]} criado`)
          detalhesProcessados.push({
            linha: numeroLinha,
            cracha: linhaNormalizada["Crachá"],
            nome: linhaNormalizada["Nome"],
            acao: "Criado",
          })
        }

        // Registrar log de atividade
        await sql`
          INSERT INTO logs_atividades (
            tipo, descricao, data_hora, sucesso, dados_extras
          ) VALUES (
            'importacao_colaborador',
            ${`Colaborador ${linhaNormalizada["Crachá"]} - ${linhaNormalizada["Nome"]} processado via importação Excel`},
            NOW(),
            true,
            ${JSON.stringify({ linha: numeroLinha, cracha: linhaNormalizada["Crachá"], nome: linhaNormalizada["Nome"] })}
          )
        `

        processados++
        console.log(`[v0] Linha ${numeroLinha} processada com sucesso`)
      } catch (error) {
        console.error(`[v0] Erro na linha ${numeroLinha}:`, error)
        erros++
        detalhes.push(`Linha ${numeroLinha}: ERRO - ${error.message}`)
        detalhesErros.push({
          linha: numeroLinha,
          erro: error.message,
          dados: linha,
        })

        // Registrar erro no log
        await sql`
          INSERT INTO logs_atividades (
            tipo, descricao, data_hora, sucesso, dados_extras
          ) VALUES (
            'erro_importacao_colaborador',
            ${`Erro ao processar colaborador na linha ${numeroLinha}: ${error.message}`},
            NOW(),
            false,
            ${JSON.stringify({ linha: numeroLinha, erro: error.message })}
          )
        `
      }
    }

    const resultado = {
      processados,
      erros,
      total: dados.length,
      detalhes: detalhes.join("\n"),
      detalhesProcessados,
      detalhesErros,
    }

    console.log("[v0] Importação concluída:", resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[v0] Erro geral na importação:", error)
    return NextResponse.json({ error: `Erro ao processar arquivo: ${error.message}` }, { status: 500 })
  }
}
