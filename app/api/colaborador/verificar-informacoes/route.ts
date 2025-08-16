import { type NextRequest, NextResponse } from "next/server"
import { sql, db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { cracha, nomeCompleto, cargo, empresa, nomeSupervisor } = await request.json()

    if (!cracha || !nomeCompleto || !cargo || !empresa || !nomeSupervisor) {
      return NextResponse.json({ ok: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    let usuario = null
    let tipoUsuario = null

    // Try to find colaborador first
    const colaborador = await db.findColaboradorByCracha(cracha)
    if (colaborador) {
      usuario = colaborador
      tipoUsuario = "colaborador"
    } else {
      // Try to find administrador
      try {
        const adminResult = await sql`
          SELECT id, nome_completo as nome, cracha, ativo 
          FROM administradores 
          WHERE cracha = ${cracha} 
          LIMIT 1
        `
        if (adminResult[0]) {
          usuario = adminResult[0]
          tipoUsuario = "administrador"
        }
      } catch (error) {
        console.error("Erro ao buscar administrador:", error)
      }
    }

    if (!usuario) {
      return NextResponse.json({ ok: false, error: "Crachá não encontrado" }, { status: 404 })
    }

    try {
      // Create recovery request for admin approval
      const result = await sql`
        INSERT INTO solicitacoes_recuperacao (
          colaborador_id, nome_completo, cargo, empresa, nome_supervisor,
          ip_address, user_agent
        ) VALUES (
          ${usuario.id}, ${nomeCompleto}, ${cargo}, ${empresa}, ${nomeSupervisor},
          ${request.headers.get("x-forwarded-for") || "unknown"},
          ${request.headers.get("user-agent") || "unknown"}
        )
        RETURNING id
      `

      const solicitacaoId = result[0].id

      // Register recovery request
      try {
        await db.registrarAcao({
          colaboradorId: usuario.id,
          acao: `solicitacao_recuperacao_criada_${tipoUsuario}`,
          detalhes: `Solicitação de recuperação de código criada para ${tipoUsuario} (ID: ${solicitacaoId})`,
          executadoPor: "Sistema",
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        })
      } catch (historyError) {
        console.error("Erro ao registrar histórico:", historyError)
        // Continue mesmo se falhar o registro do histórico
      }

      return NextResponse.json({
        ok: true,
        solicitacaoId,
        usuarioId: usuario.id,
        nome: usuario.nome,
        tipo: tipoUsuario,
        message: "Solicitação de recuperação enviada com sucesso! Aguarde a aprovação do administrador.",
      })
    } catch (dbError) {
      console.error("Erro na base de dados:", dbError)
      return NextResponse.json(
        {
          ok: false,
          error: "Erro ao criar solicitação na base de dados. Verifique se as tabelas estão criadas corretamente.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao criar solicitação de recuperação:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
