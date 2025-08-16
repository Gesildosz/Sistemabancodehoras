import { getUltimaAtualizacaoColaborador } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return Response.json({ error: "ID do colaborador inválido" }, { status: 400 })
    }

    const ultimaAtualizacao = await getUltimaAtualizacaoColaborador(colaboradorId)

    return Response.json(ultimaAtualizacao)
  } catch (error) {
    console.error("Erro ao buscar última atualização:", error)
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
