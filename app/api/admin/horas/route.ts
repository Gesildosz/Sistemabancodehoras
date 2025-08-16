import { type NextRequest, NextResponse } from "next/server"
import { db, createNotificacao } from "@/lib/database"

// POST - Create time entry
export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, horas, motivo, mensagemPopup, criadoPor } = await request.json()

    console.log("[v0] Recebendo lançamento de horas:", {
      colaboradorId,
      horas,
      motivo,
      mensagemPopup,
      criadoPor,
    })

    if (!colaboradorId || horas === undefined || horas === null) {
      return NextResponse.json({ error: "Colaborador ID e horas são obrigatórios" }, { status: 400 })
    }

    // Verify colaborador exists
    const colaborador = await db.findColaboradorById(colaboradorId)
    if (!colaborador) {
      console.log("[v0] Colaborador não encontrado:", colaboradorId)
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    console.log("[v0] Colaborador encontrado:", colaborador.nome)

    const saldoAnterior = await db.calculateBalance(colaboradorId)
    console.log("[v0] Saldo anterior:", saldoAnterior)

    const lancamento = await db.createHoraLancamento({
      colaborador_id: colaboradorId,
      horas: Number(horas),
      motivo: motivo || null,
      mensagem_popup: mensagemPopup || null,
      criado_por: criadoPor || "Administrador",
    })

    console.log("[v0] Lançamento criado:", lancamento)

    const novoSaldo = await db.calculateBalance(colaboradorId)
    console.log("[v0] Novo saldo:", novoSaldo)

    const tipoHoras = Number(horas) > 0 ? "crédito" : "débito"
    const valorAbsoluto = Math.abs(Number(horas))

    await createNotificacao({
      colaboradorId: colaboradorId,
      tipo: tipoHoras === "crédito" ? "sucesso" : "aviso",
      titulo: `${tipoHoras === "crédito" ? "Crédito" : "Débito"} de Horas`,
      mensagem: `${tipoHoras === "crédito" ? "Foram creditadas" : "Foram debitadas"} ${valorAbsoluto}h ${motivo ? `- ${motivo}` : ""}. Saldo atual: ${novoSaldo}h`,
      criadoPor: criadoPor || "Administrador",
    })

    console.log("[v0] Notificação criada para colaborador")

    return NextResponse.json(
      {
        ...lancamento,
        saldoAnterior,
        novoSaldo,
        diferenca: novoSaldo - saldoAnterior,
        colaboradorNome: colaborador.nome,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating hora lancamento:", error)
    return NextResponse.json({ error: "Erro ao lançar horas" }, { status: 500 })
  }
}
