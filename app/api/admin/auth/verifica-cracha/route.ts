import { NextResponse } from "next/server"
import { findAdministradorByCracha } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { cracha } = await request.json()

    if (!cracha) {
      return NextResponse.json({ ok: false, error: "Crachá é obrigatório" })
    }

    const admin = await findAdministradorByCracha(cracha)

    if (!admin) {
      return NextResponse.json({ ok: false, error: "Crachá não encontrado ou inativo" })
    }

    return NextResponse.json({
      ok: true,
      adminId: admin.id,
      nome: admin.nome_completo,
    })
  } catch (error) {
    console.error("Error verifying admin cracha:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" })
  }
}
