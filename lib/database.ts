import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

function cleanDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove channel_binding parameter which is not supported by @neondatabase/serverless
    urlObj.searchParams.delete("channel_binding")
    return urlObj.toString()
  } catch (error) {
    console.error("Error cleaning DATABASE_URL:", error)
    return url
  }
}

export const sql = neon(cleanDatabaseUrl(process.env.DATABASE_URL))

// Database types
export interface Colaborador {
  id: number
  nome: string
  cracha: string
  codigo_acesso: string
  codigo_temporario?: string
  primeiro_acesso: boolean
  tentativas_codigo: number
  bloqueado: boolean
  ultimo_token_bloqueio: string | null
  criado_em: string
  atualizado_em: string
  data_nascimento: string
  cargo: string
  supervisor: string
  turno: string
  telefone: string
}

export interface HoraLancamento {
  id: number
  colaborador_id: number
  data_lancamento: string
  horas: number
  motivo: string | null
  mensagem_popup?: string | null
  criado_por: string
  criado_em: string
}

export interface SolicitacaoFolga {
  id: number
  colaborador_id: number
  data_folga: string
  dia_semana: string
  horas_debitadas: number
  motivo: string | null
  status: "pendente" | "aprovada" | "recusada" | "cancelada"
  aprovado_por: string | null
  observacoes_admin: string | null
  data_solicitacao: string
  data_resposta: string | null
}

export interface HistoricoAcao {
  id: number
  colaborador_id: number
  acao: string
  detalhes: string
  ip_address: string | null
  user_agent: string | null
  executado_por: string
  data_acao: string
}

export interface Notificacao {
  id: number
  colaborador_id: number
  tipo: "info" | "sucesso" | "aviso" | "erro"
  titulo: string
  mensagem: string
  lida: boolean
  criado_por: string
  data_criacao: string
}

export interface Administrador {
  id: number
  nome_completo: string
  cracha: string
  cpf: string
  telefone: string
  cargo: string
  empresa: string
  usuario: string
  senha_hash: string
  permissoes: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Database operations
export const db = {
  // Find colaborador by cracha
  async findColaboradorByCracha(cracha: string): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE cracha = ${cracha} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by cracha:", error)
      return null
    }
  },

  // Find colaborador by id
  async findColaboradorById(id: number): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE id = ${id} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by id:", error)
      return null
    }
  },

  // Update colaborador tentativas
  async updateTentativas(id: number, tentativas: number) {
    try {
      await sql`
        UPDATE colaboradores 
        SET tentativas_codigo = ${tentativas}, atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error updating tentativas:", error)
      throw error
    }
  },

  // Block colaborador
  async blockColaborador(id: number, token: string) {
    try {
      await sql`
        UPDATE colaboradores 
        SET bloqueado = TRUE, 
            ultimo_token_bloqueio = ${token},
            atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error blocking colaborador:", error)
      throw error
    }
  },

  // Unblock colaborador
  async unblockColaborador(id: number, newCode: string) {
    try {
      await sql`
        UPDATE colaboradores 
        SET codigo_acesso = ${newCode}, 
            tentativas_codigo = 0,
            bloqueado = FALSE,
            ultimo_token_bloqueio = NULL,
            atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error unblocking colaborador:", error)
      throw error
    }
  },

  // Find colaborador by token
  async findColaboradorByToken(token: string): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE ultimo_token_bloqueio = ${token} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by token:", error)
      return null
    }
  },

  // Create time entry
  async createHoraLancamento(data: Omit<HoraLancamento, "id" | "data_lancamento" | "criado_em">) {
    try {
      const result = await sql`
        INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, mensagem_popup, criado_por)
        VALUES (${data.colaborador_id}, ${data.horas}, ${data.motivo}, ${data.mensagem_popup || null}, ${data.criado_por})
        RETURNING *
      `
      return result[0] as HoraLancamento
    } catch (error) {
      console.error("Error creating hora lancamento:", error)
      throw error
    }
  },

  // Get time entries for colaborador
  async getHorasLancamentos(colaboradorId: number): Promise<HoraLancamento[]> {
    try {
      const result = await sql`
        SELECT * FROM hora_lancamentos 
        WHERE colaborador_id = ${colaboradorId}
        ORDER BY data_lancamento DESC
      `
      return result as HoraLancamento[]
    } catch (error) {
      console.error("Error getting horas lancamentos:", error)
      return []
    }
  },

  // Calculate balance for colaborador
  async calculateBalance(colaboradorId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COALESCE(SUM(horas), 0) as saldo
        FROM hora_lancamentos 
        WHERE colaborador_id = ${colaboradorId}
      `
      return Number(result[0]?.saldo || 0)
    } catch (error) {
      console.error("Error calculating balance:", error)
      return 0
    }
  },

  // Get all colaboradores
  async getAllColaboradores(): Promise<Colaborador[]> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores 
        ORDER BY nome ASC
      `
      return result as Colaborador[]
    } catch (error) {
      console.error("Error getting all colaboradores:", error)
      return []
    }
  },

  // Create new colaborador
  async createColaborador(data: {
    nome: string
    cracha: string
    codigoTemporario: string
    dataNascimento: string
    cargo: string
    supervisor: string
    turno: string
    telefone: string
  }): Promise<Colaborador> {
    try {
      // Use placeholder for codigo_acesso since user will create their own later
      const result = await sql`
        INSERT INTO colaboradores (nome, cracha, codigo_acesso, codigo_temporario, primeiro_acesso, data_nascimento, cargo, supervisor, turno, telefone)
        VALUES (${data.nome}, ${data.cracha}, 'TEMP_PLACEHOLDER', ${data.codigoTemporario}, TRUE, ${data.dataNascimento}, ${data.cargo}, ${data.supervisor}, ${data.turno}, ${data.telefone})
        RETURNING *
      `
      return result[0] as Colaborador
    } catch (error) {
      console.error("Error creating colaborador:", error)
      throw error
    }
  },

  // Get all time entries with colaborador names
  async getAllHorasLancamentos(): Promise<(HoraLancamento & { colaborador_nome: string })[]> {
    try {
      const result = await sql`
        SELECT hl.*, c.nome as colaborador_nome
        FROM hora_lancamentos hl
        JOIN colaboradores c ON hl.colaborador_id = c.id
        ORDER BY hl.data_lancamento DESC
      `
      return result as (HoraLancamento & { colaborador_nome: string })[]
    } catch (error) {
      console.error("Error getting all horas lancamentos:", error)
      return []
    }
  },

  async checkCargoConflict(
    colaboradorId: number,
    dataFolga: string,
  ): Promise<{
    hasConflict: boolean
    conflictDetails?: { nome: string; cracha: string; cargo: string }
  }> {
    try {
      // Get the colaborador's cargo
      const colaboradorResult = await sql`
        SELECT cargo FROM colaboradores WHERE id = ${colaboradorId}
      `

      if (colaboradorResult.length === 0) {
        return { hasConflict: false }
      }

      const cargo = colaboradorResult[0].cargo

      // Check if there's already an approved leave for the same cargo on the same date
      const conflictResult = await sql`
        SELECT c.nome, c.cracha, c.cargo
        FROM solicitacoes_folga sf
        JOIN colaboradores c ON sf.colaborador_id = c.id
        WHERE c.cargo = ${cargo}
        AND sf.data_folga = ${dataFolga}
        AND sf.status = 'aprovada'
        AND sf.colaborador_id != ${colaboradorId}
        LIMIT 1
      `

      if (conflictResult.length > 0) {
        return {
          hasConflict: true,
          conflictDetails: conflictResult[0] as { nome: string; cracha: string; cargo: string },
        }
      }

      return { hasConflict: false }
    } catch (error) {
      console.error("Error checking cargo conflict:", error)
      return { hasConflict: false }
    }
  },

  async createSolicitacaoFolga(colaboradorId: number, dataFolga: string, motivo?: string): Promise<SolicitacaoFolga> {
    try {
      const cargoCheck = await db.checkCargoConflict(colaboradorId, dataFolga)

      if (cargoCheck.hasConflict && cargoCheck.conflictDetails) {
        throw new Error(
          `Não é possível solicitar folga para esta data. O colaborador ${cargoCheck.conflictDetails.nome} (${cargoCheck.conflictDetails.cracha}) do cargo ${cargoCheck.conflictDetails.cargo} já tem folga aprovada para este dia. Apenas uma pessoa por cargo pode tirar folga no mesmo dia.`,
        )
      }

      const [ano, mes, dia] = dataFolga.split("-").map(Number)
      const dataFolgaDate = new Date(ano, mes - 1, dia)
      const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
      const diaSemana = diasSemana[dataFolgaDate.getDay()]

      // Calcular horas a debitar baseado no dia da semana
      const horasDebitadas = diaSemana === "sábado" ? 4 : 8

      await sql`
        INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
        VALUES (${colaboradorId}, ${-horasDebitadas}, ${"Folga solicitada - " + new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR") + " (Pendente de aprovação)"}, 'Sistema - Colaborador')
      `

      const result = await sql`
        INSERT INTO solicitacoes_folga (colaborador_id, data_folga, dia_semana, horas_debitadas, motivo)
        VALUES (${colaboradorId}, ${dataFolga}, ${diaSemana}, ${horasDebitadas}, ${motivo || null})
        RETURNING *
      `
      return result[0] as SolicitacaoFolga
    } catch (error) {
      console.error("Error creating solicitacao folga:", error)
      throw error
    }
  },

  async getSolicitacoesFolgaByColaborador(colaboradorId: number): Promise<SolicitacaoFolga[]> {
    try {
      const result = await sql`
        SELECT * FROM solicitacoes_folga 
        WHERE colaborador_id = ${colaboradorId}
        ORDER BY data_solicitacao DESC
      `
      return result as SolicitacaoFolga[]
    } catch (error) {
      console.error("Error getting solicitacoes folga:", error)
      return []
    }
  },

  async getAllSolicitacoesFolga(): Promise<
    (SolicitacaoFolga & { colaborador_nome: string; colaborador_cracha: string })[]
  > {
    try {
      const result = await sql`
        SELECT sf.*, c.nome as colaborador_nome, c.cracha as colaborador_cracha
        FROM solicitacoes_folga sf
        JOIN colaboradores c ON sf.colaborador_id = c.id
        ORDER BY 
          CASE WHEN sf.status = 'pendente' THEN 0 ELSE 1 END,
          sf.data_solicitacao DESC
      `
      return result as (SolicitacaoFolga & { colaborador_nome: string; colaborador_cracha: string })[]
    } catch (error) {
      console.error("Error getting all solicitacoes folga:", error)
      return []
    }
  },

  async processarSolicitacaoFolga(id: number, status: "aprovada" | "recusada"): Promise<void> {
    try {
      // Get the leave request details
      const solicitacao = await sql`
        SELECT * FROM solicitacoes_folga WHERE id = ${id}
      `

      if (solicitacao[0]) {
        const folga = solicitacao[0] as SolicitacaoFolga

        if (status === "aprovada") {
          // Find the specific time entry first, then update it
          const timeEntryResult = await sql`
            SELECT id FROM hora_lancamentos
            WHERE colaborador_id = ${folga.colaborador_id} 
            AND horas = ${-folga.horas_debitadas}
            AND motivo LIKE ${"Folga solicitada - " + new Date(folga.data_folga).toLocaleDateString("pt-BR") + "%"}
            AND data_lancamento >= (SELECT data_solicitacao FROM solicitacoes_folga WHERE id = ${id})
            ORDER BY data_lancamento DESC
            LIMIT 1
          `

          if (timeEntryResult[0]) {
            await sql`
              UPDATE hora_lancamentos 
              SET motivo = ${"Folga aprovada - " + new Date(folga.data_folga).toLocaleDateString("pt-BR")},
                  criado_por = 'Sistema - Administrador'
              WHERE id = ${timeEntryResult[0].id}
            `
          }
        } else if (status === "recusada") {
          await sql`
            INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
            VALUES (${folga.colaborador_id}, ${folga.horas_debitadas}, ${"Folga recusada - Horas devolvidas - " + new Date(folga.data_folga).toLocaleDateString("pt-BR")}, 'Sistema - Administrador')
          `
        }
      }

      // Update the leave request status
      await sql`
        UPDATE solicitacoes_folga 
        SET status = ${status}, 
            data_resposta = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error processing solicitacao folga:", error)
      throw error
    }
  },

  async createHistoricoAcao(data: {
    colaboradorId: number
    acao: string
    detalhes: string
    executadoPor: string
    ipAddress?: string
    userAgent?: string
  }): Promise<HistoricoAcao> {
    try {
      const result = await sql`
        INSERT INTO historico_acoes (colaborador_id, acao, detalhes, executado_por, ip_address, user_agent)
        VALUES (${data.colaboradorId}, ${data.acao}, ${data.detalhes}, ${data.executadoPor}, ${data.ipAddress || null}, ${data.userAgent || null})
        RETURNING *
      `
      return result[0] as HistoricoAcao
    } catch (error) {
      console.error("Error creating historico acao:", error)
      throw error
    }
  },

  async getHistoricoAcoes(
    colaboradorId?: number,
    limit = 50,
  ): Promise<(HistoricoAcao & { colaborador_nome: string; colaborador_cracha: string })[]> {
    try {
      let query
      if (colaboradorId) {
        query = sql`
          SELECT ha.*, c.nome as colaborador_nome, c.cracha as colaborador_cracha
          FROM historico_acoes ha
          JOIN colaboradores c ON ha.colaborador_id = c.id
          WHERE ha.colaborador_id = ${colaboradorId}
          ORDER BY ha.data_acao DESC
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT ha.*, c.nome as colaborador_nome, c.cracha as colaborador_cracha
          FROM historico_acoes ha
          JOIN colaboradores c ON ha.colaborador_id = c.id
          ORDER BY ha.data_acao DESC
          LIMIT ${limit}
        `
      }

      const result = await query
      return result as (HistoricoAcao & { colaborador_nome: string; colaborador_cracha: string })[]
    } catch (error) {
      console.error("Error getting historico acoes:", error)
      return []
    }
  },

  async verificarCodigoTemporario(colaboradorId: number, codigoTemporario: string): Promise<Colaborador | null> {
    try {
      const colaborador = await sql`
        SELECT * FROM colaboradores 
        WHERE id = ${colaboradorId} 
        AND primeiro_acesso = TRUE
      `

      if (colaborador.length === 0) {
        return null
      }

      const colaboradorData = colaborador[0] as Colaborador

      // Extrair os últimos 4 dígitos do crachá
      const ultimosDigitosCracha = colaboradorData.cracha.slice(-4)

      // O código completo deve ser: código_temporario + últimos 4 dígitos do crachá
      const codigoCompleto = colaboradorData.codigo_temporario + ultimosDigitosCracha

      // Verificar se o código digitado corresponde ao código completo
      if (codigoTemporario === codigoCompleto) {
        return colaboradorData
      }

      return null
    } catch (error) {
      console.error("Error verifying temporary code:", error)
      return null
    }
  },

  async cadastrarCodigoFixo(colaboradorId: number, codigoFixo: string): Promise<void> {
    try {
      await sql`
        UPDATE colaboradores 
        SET codigo_acesso = ${codigoFixo}, 
            primeiro_acesso = FALSE,
            codigo_temporario = NULL,
            tentativas_codigo = 0,
            atualizado_em = NOW()
        WHERE id = ${colaboradorId}
      `
    } catch (error) {
      console.error("Error registering permanent code:", error)
      throw error
    }
  },

  async registrarAcao(data: {
    colaboradorId: number
    acao: string
    detalhes: string
    executadoPor: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    try {
      await sql`
        INSERT INTO historico_acoes (colaborador_id, acao, detalhes, executado_por, ip_address, user_agent)
        VALUES (${data.colaboradorId}, ${data.acao}, ${data.detalhes}, ${data.executadoPor}, ${data.ipAddress || null}, ${data.userAgent || null})
      `
    } catch (error) {
      console.error("Error registering action:", error)
      throw error
    }
  },

  async reagendarSolicitacaoFolga(
    solicitacaoId: number,
    novaDataFolga: string,
    novoMotivo?: string,
  ): Promise<{
    success: boolean
    error?: string
    colaboradorId?: number
  }> {
    try {
      // Get the current leave request
      const solicitacaoResult = await sql`
        SELECT * FROM solicitacoes_folga WHERE id = ${solicitacaoId} AND status = 'pendente'
      `

      if (solicitacaoResult.length === 0) {
        return { success: false, error: "Solicitação não encontrada ou já processada" }
      }

      const solicitacao = solicitacaoResult[0] as SolicitacaoFolga

      // Check if there's already a request for the new date
      const conflictResult = await sql`
        SELECT id FROM solicitacoes_folga 
        WHERE colaborador_id = ${solicitacao.colaborador_id} 
        AND data_folga = ${novaDataFolga} 
        AND status = 'pendente'
        AND id != ${solicitacaoId}
      `

      if (conflictResult.length > 0) {
        return { success: false, error: "Já existe uma solicitação pendente para esta data" }
      }

      // Calculate new hours based on new date
      const [ano, mes, dia] = novaDataFolga.split("-").map(Number)
      const novaDataFolgaDate = new Date(ano, mes - 1, dia)
      const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
      const novoDiaSemana = diasSemana[novaDataFolgaDate.getDay()]
      const novasHorasDebitadas = novoDiaSemana === "sábado" ? 4 : 8

      // Update the leave request
      await sql`
        UPDATE solicitacoes_folga 
        SET data_folga = ${novaDataFolga},
            dia_semana = ${novoDiaSemana},
            horas_debitadas = ${novasHorasDebitadas},
            motivo = ${novoMotivo || null}
        WHERE id = ${solicitacaoId}
      `

      // Find the time entry first
      const oldDataFormatted = new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")
      const newDataFormatted = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR")

      const timeEntryResult = await sql`
        SELECT id FROM hora_lancamentos 
        WHERE colaborador_id = ${solicitacao.colaborador_id} 
        AND horas = ${-solicitacao.horas_debitadas}
        AND motivo LIKE ${"Folga solicitada - " + oldDataFormatted + "%"}
        AND data_lancamento >= ${solicitacao.data_solicitacao}
        ORDER BY data_lancamento DESC
        LIMIT 1
      `

      // Update the time entry if found
      if (timeEntryResult.length > 0) {
        await sql`
          UPDATE hora_lancamentos 
          SET horas = ${-novasHorasDebitadas},
              motivo = ${"Folga reagendada para " + newDataFormatted + " (Pendente de aprovação)"}
          WHERE id = ${timeEntryResult[0].id}
        `
      }

      return { success: true, colaboradorId: solicitacao.colaborador_id }
    } catch (error) {
      console.error("Error reagendando solicitacao folga:", error)
      return { success: false, error: "Erro interno do servidor" }
    }
  },

  // Cancel leave function
  async cancelarSolicitacaoFolga(
    solicitacaoId: number,
    motivoCancelamento: string,
  ): Promise<{
    success: boolean
    error?: string
    colaboradorId?: number
  }> {
    try {
      // Get the leave request details
      const solicitacaoResult = await sql`
        SELECT * FROM solicitacoes_folga WHERE id = ${solicitacaoId} AND status = 'pendente'
      `

      if (solicitacaoResult.length === 0) {
        return { success: false, error: "Solicitação não encontrada ou já processada" }
      }

      const solicitacao = solicitacaoResult[0] as SolicitacaoFolga

      // Update the leave request status to cancelled
      await sql`
        UPDATE solicitacoes_folga 
        SET status = 'cancelada', 
            observacoes_admin = ${`Cancelada pelo colaborador. Motivo: ${motivoCancelamento}`},
            data_resposta = NOW()
        WHERE id = ${solicitacaoId}
      `

      // Return the hours to the employee's balance
      const dataFormatted = new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")
      await sql`
        INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
        VALUES (${solicitacao.colaborador_id}, ${solicitacao.horas_debitadas}, ${`Folga cancelada - Horas devolvidas - ${dataFormatted}. Motivo: ${motivoCancelamento}`}, 'Sistema - Colaborador')
      `

      return { success: true, colaboradorId: solicitacao.colaborador_id }
    } catch (error) {
      console.error("Error canceling leave request:", error)
      return { success: false, error: "Erro interno do servidor" }
    }
  },

  // Notification functions
  async createNotificacao(data: {
    colaboradorId: number
    tipo: "info" | "sucesso" | "aviso" | "erro"
    titulo: string
    mensagem: string
    criadoPor: string
  }): Promise<Notificacao> {
    try {
      const result = await sql`
        INSERT INTO notificacoes (colaborador_id, tipo, titulo, mensagem, criado_por)
        VALUES (${data.colaboradorId}, ${data.tipo}, ${data.titulo}, ${data.mensagem}, ${data.criadoPor})
        RETURNING *
      `
      return result[0] as Notificacao
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  },

  async getNotificacoesColaborador(colaboradorId: number): Promise<Notificacao[]> {
    try {
      const result = await sql`
        SELECT * FROM notificacoes 
        WHERE colaborador_id = ${colaboradorId}
        ORDER BY data_criacao DESC
        LIMIT 20
      `
      return result as Notificacao[]
    } catch (error) {
      console.error("Error getting notifications:", error)
      return []
    }
  },

  async getNotificacoesNaoLidas(colaboradorId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM notificacoes 
        WHERE colaborador_id = ${colaboradorId} AND lida = FALSE
      `
      return Number(result[0]?.count || 0)
    } catch (error) {
      console.error("Error getting unread notifications count:", error)
      return 0
    }
  },

  async marcarNotificacaoLida(notificacaoId: number): Promise<void> {
    try {
      await sql`
        UPDATE notificacoes 
        SET lida = TRUE 
        WHERE id = ${notificacaoId}
      `
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },

  async marcarTodasLidas(colaboradorId: number): Promise<void> {
    try {
      await sql`
        UPDATE notificacoes 
        SET lida = TRUE 
        WHERE colaborador_id = ${colaboradorId} AND lida = FALSE
      `
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  },

  async createAdministrador(data: {
    nome_completo: string
    cracha: string
    cpf: string
    telefone: string
    cargo: string
    empresa: string
    usuario: string
    senha_hash: string
    permissoes: string
  }): Promise<Administrador> {
    try {
      const result = await sql`
        INSERT INTO administradores (nome_completo, cracha, cpf, telefone, cargo, empresa, usuario, senha_hash, permissoes)
        VALUES (${data.nome_completo}, ${data.cracha}, ${data.cpf}, ${data.telefone}, ${data.cargo}, ${data.empresa}, ${data.usuario}, ${data.senha_hash}, ${data.permissoes})
        RETURNING *
      `
      return result[0] as Administrador
    } catch (error) {
      console.error("Error creating administrator:", error)
      throw error
    }
  },

  async getAllAdministradores(): Promise<Administrador[]> {
    try {
      const result = await sql`
        SELECT id, nome_completo, cracha, cpf, telefone, cargo, empresa, usuario, permissoes, ativo, criado_em, atualizado_em
        FROM administradores 
        WHERE ativo = TRUE
        ORDER BY nome_completo ASC
      `
      return result as Administrador[]
    } catch (error) {
      console.error("Error getting all administrators:", error)
      return []
    }
  },

  async findAdministradorByCracha(cracha: string): Promise<Administrador | null> {
    try {
      const result = await sql`
        SELECT * FROM administradores 
        WHERE cracha = ${cracha} AND ativo = TRUE 
        LIMIT 1
      `
      return (result[0] as Administrador) || null
    } catch (error) {
      console.error("Error finding administrator by cracha:", error)
      return null
    }
  },

  async authenticateAdministrador(usuario: string, _senhaHash?: string): Promise<Administrador | null> {
    try {
      const result = await sql`
        SELECT * FROM administradores 
        WHERE usuario = ${usuario} AND ativo = TRUE 
        LIMIT 1
      `
      return (result[0] as Administrador) || null
    } catch (error) {
      console.error("Error finding administrator by username:", error)
      return null
    }
  },

  async updateAdministrador(
    id: number,
    data: {
      nome_completo?: string
      cracha?: string
      cpf?: string
      telefone?: string
      cargo?: string
      empresa?: string
      usuario?: string
      senha_hash?: string
      permissoes?: string
    },
  ): Promise<Administrador | null> {
    try {
      const result = await sql`
        UPDATE administradores 
        SET 
          nome_completo = COALESCE(${data.nome_completo || null}, nome_completo),
          cracha = COALESCE(${data.cracha || null}, cracha),
          cpf = COALESCE(${data.cpf || null}, cpf),
          telefone = COALESCE(${data.telefone || null}, telefone),
          cargo = COALESCE(${data.cargo || null}, cargo),
          empresa = COALESCE(${data.empresa || null}, empresa),
          usuario = COALESCE(${data.usuario || null}, usuario),
          senha_hash = COALESCE(${data.senha_hash || null}, senha_hash),
          permissoes = COALESCE(${data.permissoes || null}, permissoes),
          atualizado_em = NOW()
        WHERE id = ${id} AND ativo = TRUE
        RETURNING *
      `
      return (result[0] as Administrador) || null
    } catch (error) {
      console.error("Error updating administrator:", error)
      throw error
    }
  },

  async getUltimaAtualizacaoColaborador(colaboradorId: number): Promise<{
    hasUpdate: boolean
    ultimaAtualizacao?: HoraLancamento & { colaborador_nome: string }
  }> {
    try {
      // Get the most recent hour entry from the last 24 hours
      const result = await sql`
        SELECT hl.*, c.nome as colaborador_nome
        FROM hora_lancamentos hl
        JOIN colaboradores c ON hl.colaborador_id = c.id
        WHERE hl.colaborador_id = ${colaboradorId}
        AND hl.data_lancamento >= NOW() - INTERVAL '24 hours'
        AND hl.mensagem_popup IS NOT NULL
        AND hl.mensagem_popup != ''
        ORDER BY hl.data_lancamento DESC
        LIMIT 1
      `

      if (result.length > 0) {
        return {
          hasUpdate: true,
          ultimaAtualizacao: result[0] as HoraLancamento & { colaborador_nome: string },
        }
      }

      return { hasUpdate: false }
    } catch (error) {
      console.error("Error getting last update:", error)
      return { hasUpdate: false }
    }
  },
}

// Export individual functions for API routes
export const createSolicitacaoFolga = db.createSolicitacaoFolga
export const getSolicitacoesFolgaByColaborador = db.getSolicitacoesFolgaByColaborador
export const getAllSolicitacoesFolga = db.getAllSolicitacoesFolga
export const processarSolicitacaoFolga = db.processarSolicitacaoFolga
export const createHistoricoAcao = db.createHistoricoAcao
export const getHistoricoAcoes = db.getHistoricoAcoes

export const verificarCodigoTemporario = db.verificarCodigoTemporario
export const cadastrarCodigoFixo = db.cadastrarCodigoFixo
export const registrarAcao = db.registrarAcao
export const reagendarSolicitacaoFolga = db.reagendarSolicitacaoFolga
export const cancelarSolicitacaoFolga = db.cancelarSolicitacaoFolga

export const createNotificacao = db.createNotificacao
export const getNotificacoesColaborador = db.getNotificacoesColaborador
export const getNotificacoesNaoLidas = db.getNotificacoesNaoLidas
export const marcarNotificacaoLida = db.marcarNotificacaoLida
export const marcarTodasLidas = db.marcarTodasLidas

export const createAdministrador = db.createAdministrador
export const getAllAdministradores = db.getAllAdministradores
export const findAdministradorByCracha = db.findAdministradorByCracha
export const authenticateAdministrador = db.authenticateAdministrador
export const updateAdministrador = db.updateAdministrador

export const getAdminByCracha = db.findAdministradorByCracha

export const getUltimaAtualizacaoColaborador = db.getUltimaAtualizacaoColaborador

export const getColaboradorById = db.findColaboradorById
