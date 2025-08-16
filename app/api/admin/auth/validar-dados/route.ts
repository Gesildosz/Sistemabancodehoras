import { type NextRequest, NextResponse } from "next/server"
import { getAdminByCracha } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { cracha, cpf, telefone, cargo } = await request.json()

    if (!cracha || !cpf || !telefone || !cargo) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Buscar administrador pelo crachá
    const admin = await getAdminByCracha(cracha)

    if (!admin) {
      return NextResponse.json({ error: "Administrador não encontrado" }, { status: 404 })
    }

    const normalizeCPF = (cpf: string) => cpf.replace(/\D/g, "")
    const normalizeTelefone = (tel: string) => tel.replace(/\D/g, "")
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

    const inputCPF = normalizeCPF(cpf)
    const adminCPF = normalizeCPF(admin.cpf || "")

    const inputTelefone = normalizeTelefone(telefone)
    const adminTelefone = normalizeTelefone(admin.telefone || "")

    const inputCargo = normalizeText(cargo)
    const adminCargo = normalizeText(admin.cargo || "")

    // Log para debug
    console.log("Validação de dados:", {
      inputCPF,
      adminCPF,
      inputTelefone,
      adminTelefone,
      inputCargo,
      adminCargo,
    })

    // Validar dados de segurança com comparação normalizada
    const cpfMatch = adminCPF === inputCPF
    const telefoneMatch = adminTelefone === inputTelefone
    const cargoMatch = adminCargo === inputCargo

    if (!cpfMatch || !telefoneMatch || !cargoMatch) {
      return NextResponse.json(
        {
          error: "Os dados informados não conferem com o cadastro",
          debug: {
            cpfMatch,
            telefoneMatch,
            cargoMatch,
            adminData: {
              cpf: adminCPF,
              telefone: adminTelefone,
              cargo: adminCargo,
            },
            inputData: {
              cpf: inputCPF,
              telefone: inputTelefone,
              cargo: inputCargo,
            },
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dados validados com sucesso",
    })
  } catch (error) {
    console.error("Erro ao validar dados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
