import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { cracha } = await request.json()

    if (!cracha) {
      return NextResponse.json({ ok: false, error: "Crachá é obrigatório" }, { status: 400 })
    }

    if (!sql) {
      console.error("Conexão com banco de dados não disponível")
      return NextResponse.json({ ok: false, error: "Erro de conexão com banco" }, { status: 500 })
    }

    let colaborador = null
    let administrador = null

    try {
      const colaboradorResult = await sql`
        SELECT id, nome, cracha, primeiro_acesso, bloqueado 
        FROM colaboradores 
        WHERE cracha = ${cracha} 
        LIMIT 1
      `
      colaborador = colaboradorResult[0] || null
    } catch (error) {
      console.error("Erro ao buscar colaborador:", error)
      // Continua mesmo com erro para tentar administrador
    }

    try {
      const adminResult = await sql`
        SELECT id, nome_completo, cracha, ativo 
        FROM administradores 
        WHERE cracha = ${cracha} 
        LIMIT 1
      `
      administrador = adminResult[0] || null
    } catch (error) {
      console.error("Erro ao buscar administrador:", error)
      // Continua mesmo com erro
    }

    if (colaborador && colaborador.bloqueado) {
      return NextResponse.json({
        ok: false,
        blocked: true,
        tipo: "colaborador",
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        cracha: colaborador.cracha,
        error: "Colaborador bloqueado. Solicite recuperação de código.",
      })
    }

    if (administrador && !administrador.ativo) {
      return NextResponse.json({
        ok: false,
        blocked: true,
        tipo: "administrador",
        adminId: administrador.id,
        nome: administrador.nome_completo,
        cracha: administrador.cracha,
        error: "Administrador inativo. Solicite recuperação de código.",
      })
    }

    if (colaborador && administrador) {
      return NextResponse.json({
        ok: true,
        dualAccess: true,
        colaborador: {
          id: colaborador.id,
          nome: colaborador.nome,
          cracha: colaborador.cracha,
          primeiroAcesso: Boolean(colaborador.primeiro_acesso),
        },
        administrador: {
          id: administrador.id,
          nome: administrador.nome_completo,
        },
      })
    } else if (colaborador) {
      return NextResponse.json({
        ok: true,
        dualAccess: false,
        tipo: "colaborador",
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        cracha: colaborador.cracha,
        primeiroAcesso: Boolean(colaborador.primeiro_acesso),
      })
    } else if (administrador) {
      return NextResponse.json({
        ok: true,
        dualAccess: false,
        tipo: "administrador",
        adminId: administrador.id,
        nome: administrador.nome_completo,
      })
    } else {
      return NextResponse.json({ ok: false, error: "Crachá não encontrado" }, { status: 404 })
    }
  } catch (error) {
    console.error("Erro crítico na verificação de crachá:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno do servidor. Tente novamente em alguns segundos.",
      },
      { status: 500 },
    )
  }
}
