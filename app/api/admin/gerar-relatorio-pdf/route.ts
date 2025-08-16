import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tipo, dados } = await request.json()

    // Simulação de geração de PDF - em produção, usar biblioteca como jsPDF ou Puppeteer
    const relatorioHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório ${tipo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .positivo { color: green; font-weight: bold; }
            .negativo { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de ${tipo}</h1>
            <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Crachá</th>
                <th>Nome</th>
                <th>Horas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dados
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.cracha}</td>
                  <td>${item.nome}</td>
                  <td class="${item.status}">${Math.floor(Math.abs(item.horas) / 60)}h ${Math.abs(item.horas) % 60}m</td>
                  <td>${item.status === "positivo" ? "Positivo" : "Negativo"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Em produção, converter HTML para PDF usando Puppeteer ou similar
    const pdfBuffer = Buffer.from(relatorioHTML, "utf-8")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${tipo}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar relatório PDF:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
