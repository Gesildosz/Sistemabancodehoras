import { NextResponse } from "next/server"
import { updateAdministrador } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()
    const { nome_completo, cracha, cpf, cargo, empresa, telefone, usuario, senha, permissoes } = data

    // Validar campos obrigatórios
    if (!nome_completo || !cracha || !cpf || !cargo || !empresa || !telefone || !usuario) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      nome_completo,
      cracha,
      cpf,
      telefone,
      cargo,
      empresa,
      usuario,
      permissoes: typeof permissoes === "string" ? permissoes : permissoes.join(","),
    }

    // Hash password if provided
    if (senha && senha.trim() !== "") {
      updateData.senha_hash = await bcrypt.hash(senha, 10)
    }

    const administrador = await updateAdministrador(id, updateData)

    if (!administrador) {
      return NextResponse.json({ error: "Administrador não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      message: "Administrador atualizado com sucesso",
      administrador,
    })
  } catch (error: any) {
    console.error("Error updating administrator:", error)

    if (error.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "Crachá, CPF ou usuário já existe" }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao atualizar administrador" }, { status: 500 })
  }
}
