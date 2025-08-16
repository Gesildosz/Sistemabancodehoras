import { type NextRequest, NextResponse } from "next/server"
import { getAdminByCracha } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { adminId } = await request.json()

    if (!adminId) {
      return NextResponse.json({ success: false, error: "ID do administrador é obrigatório" })
    }

    // Buscar administrador pelo ID
    const admin = await getAdminByCracha(adminId.toString())

    if (!admin) {
      return NextResponse.json({ success: false, error: "Administrador não encontrado" })
    }

    // Retornar credenciais (ATENÇÃO: Isso não é seguro em produção)
    return NextResponse.json({
      success: true,
      credentials: {
        usuario: admin.usuario,
        senha: "admin123", // Senha padrão para demonstração
      },
    })
  } catch (error) {
    console.error("Error getting credentials:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" })
  }
}
