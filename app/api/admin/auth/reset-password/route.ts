import { type NextRequest, NextResponse } from "next/server"
import { updateAdministrador } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { adminId, novaSenha } = await request.json()

    if (!adminId || !novaSenha) {
      return NextResponse.json(
        { ok: false, error: "ID do administrador e nova senha são obrigatórios" },
        { status: 400 },
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ ok: false, error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 12)

    // Atualizar senha no banco
    await updateAdministrador(adminId, { senha_hash: senhaHash })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
