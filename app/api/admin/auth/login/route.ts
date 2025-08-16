import { NextResponse } from "next/server"
import { authenticateAdministrador } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { usuario, senha, adminId } = await request.json()

    if (!usuario || !senha) {
      return NextResponse.json({ ok: false, error: "Usuário e senha são obrigatórios" })
    }

    const admin = await authenticateAdministrador(usuario, "")

    if (!admin || admin.id !== adminId) {
      return NextResponse.json({ ok: false, error: "Credenciais inválidas" })
    }

    const senhaValida = await bcrypt.compare(senha, admin.senha_hash)

    if (!senhaValida) {
      return NextResponse.json({ ok: false, error: "Credenciais inválidas" })
    }

    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        nome_completo: admin.nome_completo,
        usuario: admin.usuario,
        permissoes: admin.permissoes,
        cargo: admin.cargo,
        empresa: admin.empresa,
      },
    })
  } catch (error) {
    console.error("Error authenticating admin:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" })
  }
}
