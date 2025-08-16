import { NextResponse } from "next/server"
import { createAdministrador, getAllAdministradores } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const administradores = await getAllAdministradores()
    return NextResponse.json(administradores)
  } catch (error) {
    console.error("Error fetching administrators:", error)
    return NextResponse.json({ error: "Erro ao buscar administradores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nome_completo, cracha, cpf, cargo, empresa, telefone, usuario, senha, permissoes } = data

    // Validar campos obrigatórios
    if (!nome_completo || !cracha || !cpf || !cargo || !empresa || !telefone || !usuario || !senha) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    const administrador = await createAdministrador({
      nome_completo, // Use correct property name
      cracha,
      cpf,
      telefone,
      cargo,
      empresa,
      usuario,
      senha_hash: senhaHash, // Use correct property name
      permissoes: typeof permissoes === "string" ? permissoes : permissoes.join(","),
    })

    return NextResponse.json({
      ok: true,
      message: "Administrador cadastrado com sucesso",
      administrador,
    })
  } catch (error: any) {
    console.error("Error creating administrator:", error)

    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Crachá, CPF ou usuário já existe" }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao cadastrar administrador" }, { status: 500 })
  }
}
