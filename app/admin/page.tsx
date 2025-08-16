"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Users,
  Clock,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Unlock,
  LogOut,
  Shield,
  Key,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Edit,
  Lock,
  Trash2,
  Activity,
  Upload,
  Download,
  UserX,
  FileTextIcon,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import * as XLSX from "xlsx"

interface Colaborador {
  id: number
  nome: string
  cracha: string
  bloqueado: boolean
  tentativas_codigo: number
  ultimo_token_bloqueio?: string
  dataNascimento: string
  cargo: string
  supervisor: string
  turno: string
  telefone: string
}

interface SolicitacaoRecuperacao {
  id: number
  colaborador_id: number
  colaborador_nome: string
  cracha: string
  nome_completo: string
  cargo: string
  empresa: string
  nome_supervisor: string
  status: string
  motivo_recusa?: string
  criada_em: string
  processada_em?: string
  aprovada_por_nome?: string
}

interface HoraLancamento {
  id: number
  colaborador_id: number
  colaborador_nome: string
  data_lancamento: string
  horas: number
  motivo: string
  criado_por: string
}

interface SolicitacaoFolga {
  id: number
  colaborador_id: number
  colaborador_nome: string
  colaborador_cracha: string
  data_folga: string
  dia_semana: string
  horas_debitar: number
  motivo: string
  status: string
  data_solicitacao: string
  data_processamento?: string
}

interface HistoricoAcao {
  id: number
  colaborador_id: number
  colaborador_nome: string
  colaborador_cracha: string
  acao: string
  detalhes: string
  executado_por: string
  data_acao: string
}

interface Administrador {
  id: number
  nome_completo: string
  cracha: string
  cpf: string
  telefone: string
  cargo: string
  empresa: string
  usuario: string
  senha?: string
  permissoes?: string
}

interface AdminAuth {
  id: number
  nome: string
  usuario: string
  permissoes: string
  loginTime: number
}

interface ColaboradorDetalhado {
  cracha: string
  nome: string
  horas: number
  status: "positivo" | "negativo"
}

interface DadosAnalise {
  horasPositivas: number
  horasNegativas: number
  totalColaboradores: number
  colaboradoresPositivos: number
  colaboradoresNegativos: number
  colaboradoresDetalhados?: ColaboradorDetalhado[]
}

interface LogAtividade {
  id: number
  usuario_id?: number
  usuario_nome?: string
  colaborador_id?: number
  colaborador_nome?: string
  tipo: string
  descricao: string
  data_hora: string
  ip_address?: string
  sucesso: boolean
}

interface DadosLog {
  acessosHoje: number
  errosCodigo: number
  solicitacoes: number
  bloqueios: number
  atividadesPorHora: { hora: string; acessos: number; erros: number }[]
  tiposAtividade: { name: string; value: number; fill: string }[]
}

interface FiltrosLog {
  tipoAtividade: string
  dataInicio: string
  dataFim: string
}

export default function AdminPage() {
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [historico, setHistorico] = useState<HoraLancamento[]>([])
  const [solicitacoesFolga, setSolicitacoesFolga] = useState<SolicitacaoFolga[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [historicoAcoes, setHistoricoAcoes] = useState<HistoricoAcao[]>([])
  const [administradores, setAdministradores] = useState<Administrador[]>([])

  const [solicitacoesRecuperacao, setSolicitacoesRecuperacao] = useState<SolicitacaoRecuperacao[]>([])

  const [dadosAnalise, setDadosAnalise] = useState<DadosAnalise>({
    horasPositivas: 0,
    horasNegativas: 0,
    totalColaboradores: 0,
    colaboradoresPositivos: 0,
    colaboradoresNegativos: 0,
  })

  const [logsAtividades, setLogsAtividades] = useState<LogAtividade[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [dadosLog, setDadosLog] = useState<DadosLog>({
    acessosHoje: 0,
    errosCodigo: 0,
    solicitacoes: 0,
    bloqueios: 0,
    atividadesPorHora: [],
    tiposAtividade: [],
  })

  const [filtrosLog, setFiltrosLog] = useState<FiltrosLog>({
    tipoAtividade: "",
    dataInicio: "",
    dataFim: "",
  })

  // Form states
  const [novoColaborador, setNovoColaborador] = useState({
    nome: "",
    cracha: "",
    codigoAcesso: "",
    codigoTemporario: "",
    dataNascimento: "",
    cargo: "",
    supervisor: "",
    turno: "",
    telefone: "+55 ",
  })

  const [lancamentoHoras, setLancamentoHoras] = useState({
    colaboradorId: "",
    horas: "",
    motivo: "",
    mensagemPopup: "",
    criadoPor: "Administrador",
  })

  const [tokenDesbloqueio, setTokenDesbloqueio] = useState({
    token: "",
    novoCodigoAcesso: "",
  })

  const [novoAdmin, setNovoAdmin] = useState<Administrador>({
    id: 0,
    nome_completo: "",
    cracha: "",
    cpf: "",
    telefone: "+55 ",
    cargo: "",
    empresa: "",
    usuario: "",
    senha: "",
    permissoes: "",
  })

  const [editandoAdmin, setEditandoAdmin] = useState(false)

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<any>(null)

  const [activeTab, setActiveTab] = useState("colaboradores")

  const [editandoColaborador, setEditandoColaborador] = useState(false)
  const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null)

  const [importacaoExcel, setImportacaoExcel] = useState({
    arquivo: null as File | null,
    processando: false,
    progresso: 0,
    resultado: null as any,
  })

  const [modalDetalhes, setModalDetalhes] = useState({
    aberto: false,
    tipo: "" as "processados" | "erros",
    dados: [] as any[],
  })

  const [importacaoColaboradores, setImportacaoColaboradores] = useState({
    arquivo: null as File | null,
    processando: false,
    resultado: null as any,
  })

  const [listaVisivel, setListaVisivel] = useState<{
    tipo: "horasPositivas" | "horasNegativas" | "colabPositivos" | "colabNegativos" | null
    dados: ColaboradorDetalhado[]
  }>({
    tipo: null,
    dados: [],
  })

  const [pinsDesbloqueio, setPinsDesbloqueio] = useState([])

  const carregarDados = useCallback(async () => {
    try {
      const [colaboradoresRes, historicoRes, folgasRes, acoesRes, adminsRes] = await Promise.all([
        fetch("/api/admin/colaboradores"),
        fetch("/api/admin/historico"),
        fetch("/api/admin/folgas"),
        fetch("/api/admin/historico-acoes"),
        fetch("/api/admin/administradores"),
      ])

      if (colaboradoresRes.ok) {
        const colaboradoresData = await colaboradoresRes.json()
        setColaboradores(colaboradoresData)
      }

      if (historicoRes.ok) {
        const historicoData = await historicoRes.json()
        setHistorico(historicoData)
      }

      if (folgasRes.ok) {
        const folgasData = await folgasRes.json()
        setSolicitacoesFolga(folgasData)
      }

      if (acoesRes.ok) {
        const acoesData = await acoesRes.json()
        setHistoricoAcoes(acoesData)
      }

      if (adminsRes.ok) {
        const adminsData = await adminsRes.json()
        const validAdmins = Array.isArray(adminsData)
          ? adminsData
          : adminsData?.administradores && Array.isArray(adminsData.administradores)
            ? adminsData.administradores
            : []
        setAdministradores(validAdmins)
      } else {
        setAdministradores([])
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setAdministradores([])
      setHistoricoAcoes([])
    }
  }, [])

  const carregarSolicitacoesRecuperacao = async () => {
    try {
      console.log("[v0] Iniciando carregamento de solicitações de recuperação...")
      const response = await fetch("/api/admin/solicitacoes-recuperacao")
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("[v0] Response data completa:", JSON.stringify(data, null, 2))

      if (data.ok) {
        setSolicitacoesRecuperacao(data.solicitacoes)
        console.log("[v0] Solicitações carregadas com sucesso:", data.solicitacoes.length)
        console.log(
          "[v0] Detalhes das solicitações:",
          data.solicitacoes.map((s) => ({
            id: s.id,
            colaborador: s.colaborador_nome,
            status: s.status,
            criada_em: s.criada_em,
          })),
        )
      } else {
        console.error("[v0] Erro na resposta da API:", data.error)
        setError("Erro ao carregar solicitações: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar solicitações de recuperação:", error)
      setError("Erro ao carregar solicitações de recuperação: " + error.message)
    }
  }

  const processarSolicitacaoRecuperacao = async (id: number, acao: "aprovar" | "recusar", motivo?: string) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/solicitacoes-recuperacao/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao,
          motivo,
          adminId: adminAuth?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (acao === "aprovar") {
          setSuccess(`Solicitação aprovada! O colaborador deve criar um novo código de acesso no próximo login.`)
        } else {
          setSuccess("Solicitação recusada com sucesso!")
        }
        carregarSolicitacoesRecuperacao()
      } else {
        setError(data.error || "Erro ao processar solicitação")
      }
    } catch (err) {
      setError("Erro ao processar solicitação")
    } finally {
      setLoading(false)
    }
  }

  const usarSolicitacaoParaDesbloqueio = (solicitacao: any) => {
    setSolicitacaoSelecionada(solicitacao)
    setTokenDesbloqueio({
      token: solicitacao.token_desbloqueio || "",
      novoCodigoAcesso: "",
    })
    // Mudar para a aba de desbloqueio
    setActiveTab("desbloqueio")
  }

  // const checkAuthentication = useCallback(() => {
  //   const authData = localStorage.getItem("adminAuth")
  //   if (authData) {
  //     try {
  //       const auth = JSON.parse(authData)
  //       // Verificar se o login não expirou (24 horas)
  //       if (Date.now() - auth.loginTime < 24 * 60 * 60 * 1000) {
  //         setAdminAuth(auth)
  //         setLoading(false)
  //         return
  //       } else {
  //         localStorage.removeItem("adminAuth")
  //       }
  //     } catch (error) {
  //       localStorage.removeItem("adminAuth")
  //     }
  //   }
  //   router.push("/admin/login")
  // }, [router])

  // useEffect(() => {
  //   checkAuthentication()
  // }, [checkAuthentication])

  useEffect(() => {
    setAdminAuth({
      id: 1,
      nome_completo: "Administrador Sistema",
      usuario: "admin",
      loginTime: Date.now(),
    })
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin/login")
  }

  const carregarDadosAnalise = async () => {
    try {
      const response = await fetch("/api/admin/analise")
      if (response.ok) {
        const dados = await response.json()
        setDadosAnalise(dados)
      }
    } catch (error) {
      console.error("Erro ao carregar dados de análise:", error)
    }
  }

  const carregarDadosLog = async () => {
    try {
      console.log("[v0] Carregando dados do log...")
      const response = await fetch("/api/admin/logs")

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Response não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API não é JSON válido")
      }

      const data = await response.json()
      console.log("[v0] Dados recebidos:", data)

      if (data.dadosLog) {
        setDadosLog(data.dadosLog)
        console.log("[v0] Dados do log definidos com sucesso")
      } else {
        console.warn("[v0] dadosLog não encontrado na resposta")
        setDadosLog({
          acessosHoje: 0,
          errosCodigo: 0,
          solicitacoes: 0,
          bloqueios: 0,
          atividadesPorHora: [],
          tiposAtividade: [],
        })
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar dados do log:", error)
      setError("Erro ao carregar dados do log: " + (error instanceof Error ? error.message : "Erro desconhecido"))
      setDadosLog({
        acessosHoje: 0,
        errosCodigo: 0,
        solicitacoes: 0,
        bloqueios: 0,
        atividadesPorHora: [],
        tiposAtividade: [],
      })
    }
  }

  const carregarLogsAtividades = async (pagina = 1) => {
    try {
      console.log("[v0] Carregando logs de atividades, página:", pagina)
      const params = new URLSearchParams({
        pagina: String(pagina),
        ...(filtrosLog.tipoAtividade && { tipo: filtrosLog.tipoAtividade }),
        ...(filtrosLog.dataInicio && { dataInicio: filtrosLog.dataInicio }),
        ...(filtrosLog.dataFim && { dataFim: filtrosLog.dataFim }),
      })

      const response = await fetch(`/api/admin/logs?${params.toString()}`)

      console.log("[v0] Response status logs:", response.status)

      if (!response.ok) {
        throw new Error(`Erro ao carregar logs: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Response logs não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API de logs não é JSON válido")
      }

      const data = await response.json()
      console.log("[v0] Logs carregados:", data.logs?.length || 0)

      setLogsAtividades(data.logs || [])
      setTotalLogs(data.total || 0)
      setPaginaAtual(pagina)
    } catch (error) {
      console.error("[v0] Erro ao carregar logs de atividades:", error)
      setError("Erro ao carregar logs de atividades: " + (error instanceof Error ? error.message : "Erro desconhecido"))
      setLogsAtividades([])
      setTotalLogs(0)
    }
  }

  const buscarLogs = async () => {
    setPaginaAtual(1)
    await carregarLogsAtividades(1)
  }

  const buscarColaboradoresPorCategoria = async (categoria: string) => {
    try {
      const response = await fetch(`/api/admin/colaboradores-categoria?tipo=${categoria}`)
      if (response.ok) {
        const dados = await response.json()
        setListaVisivel({
          tipo: categoria as any,
          dados: dados.colaboradores || [],
        })
      }
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error)
    }
  }

  const gerarRelatorioPDF = async (tipo: string, dados: ColaboradorDetalhado[]) => {
    try {
      const response = await fetch("/api/admin/gerar-relatorio-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, dados }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `relatorio-${tipo}-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    }
  }

  const carregarPinsDesbloqueio = async () => {
    try {
      console.log("[v0] Carregando PINs de desbloqueio")
      const response = await fetch("/api/admin/pins-desbloqueio")
      const data = await response.json()

      if (response.ok) {
        console.log("[v0] PINs carregados:", data.pins?.length || 0)
        setPinsDesbloqueio(data.pins || [])
      } else {
        console.error("[v0] Erro ao carregar PINs:", data.error)
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar PINs:", error)
    }
  }

  useEffect(() => {
    if (!loading && !adminAuth) {
      return
    }
    carregarDados()
    carregarSolicitacoesRecuperacao()
    carregarPinsDesbloqueio()
    carregarDadosAnalise()
    carregarLogsAtividades()
    carregarDadosLog()
  }, [loading, adminAuth, carregarDados, filtrosLog])

  const testarLogin = async (usuario: string, senha: string) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Login testado com sucesso para usuário: ${usuario}`)
        return true
      } else {
        setError(`Erro no teste de login: ${data.error}`)
        return false
      }
    } catch (error) {
      setError("Erro ao testar login")
      return false
    }
  }

  const cadastrarColaborador = async () => {
    // Removido codigoAcesso da validação
    if (
      !novoColaborador.nome ||
      !novoColaborador.cracha ||
      !novoColaborador.codigoTemporario ||
      !novoColaborador.dataNascimento ||
      !novoColaborador.cargo ||
      !novoColaborador.supervisor ||
      !novoColaborador.turno ||
      !novoColaborador.telefone
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoColaborador),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador cadastrado com sucesso!")
        // Removido codigoAcesso do reset do formulário
        setNovoColaborador({
          nome: "",
          cracha: "",
          codigoAcesso: "",
          dataNascimento: "",
          cargo: "",
          supervisor: "",
          turno: "",
          telefone: "+55 ",
          codigoTemporario: "",
        })
        carregarDados()
      } else {
        setError(data.error || "Erro ao cadastrar colaborador")
      }
    } catch (err) {
      setError("Erro ao cadastrar colaborador")
    } finally {
      setLoading(false)
    }
  }

  const atualizarSaldoColaborador = async (colaboradorId: number) => {
    try {
      const response = await fetch(`/api/colaborador/${colaboradorId}/banco`)
      if (response.ok) {
        const data = await response.json()
        console.log(`[v0] Saldo atualizado para colaborador ${colaboradorId}: ${data.saldo}h`)

        // Atualizar a lista de colaboradores com o novo saldo
        setColaboradores((prev) => prev.map((col) => (col.id === colaboradorId ? { ...col, saldo: data.saldo } : col)))
      }
    } catch (error) {
      console.error("[v0] Erro ao atualizar saldo:", error)
    }
  }

  const lancarHoras = async () => {
    if (!lancamentoHoras.colaboradorId || !lancamentoHoras.horas) {
      setError("Colaborador e horas são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[v0] Lançando horas:", {
        colaboradorId: lancamentoHoras.colaboradorId,
        horas: lancamentoHoras.horas,
        motivo: lancamentoHoras.motivo,
      })

      const response = await fetch("/api/admin/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: Number.parseInt(lancamentoHoras.colaboradorId),
          horas: Number.parseInt(lancamentoHoras.horas),
          motivo: lancamentoHoras.motivo,
          mensagemPopup: lancamentoHoras.mensagemPopup,
          criadoPor: lancamentoHoras.criadoPor,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Horas lançadas com sucesso:", data)
        setSuccess(
          `Horas lançadas com sucesso! ${Number.parseInt(lancamentoHoras.horas) > 0 ? "Crédito" : "Débito"} de ${Math.abs(Number.parseInt(lancamentoHoras.horas))}h aplicado.`,
        )

        await atualizarSaldoColaborador(Number.parseInt(lancamentoHoras.colaboradorId))

        setLancamentoHoras({ colaboradorId: "", horas: "", motivo: "", mensagemPopup: "", criadoPor: "Administrador" })

        // Recarregar dados gerais após um pequeno delay para garantir consistência
        setTimeout(() => {
          carregarDados()
        }, 500)
      } else {
        console.error("[v0] Erro ao lançar horas:", data)
        setError(data.error || "Erro ao lançar horas")
      }
    } catch (err) {
      console.error("[v0] Erro na requisição:", err)
      setError("Erro ao lançar horas")
    } finally {
      setLoading(false)
    }
  }

  const processarImportacaoExcel = async () => {
    if (!importacaoExcel.arquivo) {
      setError("Selecione um arquivo Excel para importar")
      return
    }

    setImportacaoExcel((prev) => ({ ...prev, processando: true, progresso: 0 }))
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("arquivo", importacaoExcel.arquivo)

      const response = await fetch("/api/admin/importar-horas-excel", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Importação concluída! ${data.processados} registros processados, ${data.erros} erros.`)
        setImportacaoExcel({ arquivo: null, processando: false, progresso: 100, resultado: data })
        carregarDados()
      } else {
        setError(data.erro || "Erro ao processar arquivo Excel")
      }
    } catch (err) {
      setError("Erro ao importar arquivo Excel")
    } finally {
      setImportacaoExcel((prev) => ({ ...prev, processando: false }))
    }
  }

  const desbloquearColaborador = async () => {
    if (!tokenDesbloqueio.token || !tokenDesbloqueio.novoCodigoAcesso) {
      setError("Token e novo código são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/desbloquear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenDesbloqueio),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador desbloqueado com sucesso!")
        setTokenDesbloqueio({ token: "", novoCodigoAcesso: "" })
        carregarDados()
      } else {
        setError(data.error || "Erro ao desbloquear colaborador")
      }
    } catch (err) {
      setError("Erro ao desbloquear colaborador")
    } finally {
      setLoading(false)
    }
  }

  const processarSolicitacaoFolga = async (id: number, status: "aprovada" | "recusada") => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/folgas/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Solicitação ${status} com sucesso!`)
        carregarDados()
      } else {
        setError(data.error || "Erro ao processar solicitação")
      }
    } catch (err) {
      setError("Erro ao processar solicitação")
    } finally {
      setLoading(false)
    }
  }

  const formatarHoras = (horas: number) => {
    const sinal = horas >= 0 ? "+" : ""
    return `${sinal}${horas}h`
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case "LOGIN_SUCESSO":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "TENTATIVA_LOGIN_INCORRETA":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "BLOQUEIO_AUTOMATICO":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      case "DESBLOQUEIO_MANUAL":
        return <Unlock className="h-4 w-4 text-blue-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getAcaoCor = (acao: string) => {
    switch (acao) {
      case "LOGIN_SUCESSO":
        return "bg-green-500/20 text-green-200 border-green-400/30"
      case "TENTATIVA_LOGIN_INCORRETA":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
      case "BLOQUEIO_AUTOMATICO":
        return "bg-red-500/20 text-red-200 border-red-400/30"
      case "DESBLOQUEIO_MANUAL":
        return "bg-blue-500/20 text-blue-200 border-blue-400/30"
      default:
        return "bg-gray-500/20 text-gray-200 border-gray-400/30"
    }
  }

  const cadastrarAdministrador = async () => {
    if (
      !novoAdmin.nome_completo ||
      !novoAdmin.cracha ||
      !novoAdmin.cpf ||
      !novoAdmin.telefone ||
      !novoAdmin.cargo ||
      !novoAdmin.empresa ||
      !novoAdmin.usuario ||
      !novoAdmin.senha
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const method = editandoAdmin ? "PUT" : "POST"
      const url = editandoAdmin ? `/api/admin/administradores/${novoAdmin.id}` : "/api/admin/administradores"

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novoAdmin,
          permissoes: novoAdmin.permissoes || "",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Administrador ${editandoAdmin ? "atualizado" : "cadastrado"} com sucesso!`)
        setNovoAdmin({
          id: 0,
          nome_completo: "",
          cracha: "",
          cpf: "",
          telefone: "+55 ",
          cargo: "",
          empresa: "",
          usuario: "",
          senha: "",
          permissoes: "",
        })
        setEditandoAdmin(false)
        carregarDados()
      } else {
        setError(data.error || `Erro ao ${editandoAdmin ? "atualizar" : "cadastrar"} administrador`)
      }
    } catch (err) {
      setError(`Erro ao ${editandoAdmin ? "atualizar" : "cadastrar"} administrador`)
    } finally {
      setLoading(false)
    }
  }

  const editarAdministrador = (admin: Administrador) => {
    setNovoAdmin({
      id: admin.id,
      nome_completo: admin.nome_completo || "",
      cracha: admin.cracha || "",
      cpf: admin.cpf || "",
      telefone: admin.telefone || "+55 ",
      cargo: admin.cargo || "",
      empresa: admin.empresa || "",
      usuario: admin.usuario || "",
      senha: "", // Não exibir a senha por segurança
      permissoes: admin.permissoes || "",
    })
    setEditandoAdmin(true)
  }

  const cancelarEdicao = () => {
    setNovoAdmin({
      id: 0,
      nome_completo: "",
      cracha: "",
      cpf: "",
      telefone: "+55 ",
      cargo: "",
      empresa: "",
      usuario: "",
      senha: "",
      permissoes: "",
    })
    setEditandoAdmin(false)
  }

  const editarColaborador = (colaborador: Colaborador) => {
    setColaboradorEditando(colaborador)
    setNovoColaborador({
      nome: colaborador.nome || "",
      cracha: colaborador.cracha || "",
      codigoAcesso: "",
      codigoTemporario: "",
      dataNascimento: colaborador.dataNascimento || "",
      cargo: colaborador.cargo || "",
      supervisor: colaborador.supervisor || "",
      turno: colaborador.turno || "",
      telefone: colaborador.telefone || "+55 ",
    })
    setEditandoColaborador(true)
    setActiveTab("cadastro")
  }

  const cancelarEdicaoColaborador = () => {
    setColaboradorEditando(null)
    setNovoColaborador({
      nome: "",
      cracha: "",
      codigoAcesso: "",
      codigoTemporario: "",
      dataNascimento: "",
      cargo: "",
      supervisor: "",
      turno: "",
      telefone: "+55 ",
    })
    setEditandoColaborador(false)
  }

  const atualizarColaborador = async () => {
    if (!colaboradorEditando) return

    if (
      !novoColaborador.nome ||
      !novoColaborador.cracha ||
      !novoColaborador.dataNascimento ||
      !novoColaborador.cargo ||
      !novoColaborador.supervisor ||
      !novoColaborador.turno ||
      !novoColaborador.telefone
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/colaboradores/${colaboradorEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoColaborador),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador atualizado com sucesso!")
        cancelarEdicaoColaborador()
        carregarDados()
      } else {
        setError(data.error || "Erro ao atualizar colaborador")
      }
    } catch (err) {
      setError("Erro ao atualizar colaborador")
    } finally {
      setLoading(false)
    }
  }

  const bloquearDesbloquearColaborador = async (colaboradorId: number, bloquear: boolean) => {
    const acao = bloquear ? "bloquear" : "desbloquear"

    if (!confirm(`Tem certeza que deseja ${acao} este colaborador?`)) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/colaboradores/${colaboradorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueado: bloquear }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Colaborador ${bloquear ? "bloqueado" : "desbloqueado"} com sucesso!`)
        carregarDados()
      } else {
        setError(data.error || `Erro ao ${acao} colaborador`)
      }
    } catch (err) {
      setError(`Erro ao ${acao} colaborador`)
    } finally {
      setLoading(false)
    }
  }

  const excluirColaborador = async (colaboradorId: number, nomeColaborador: string) => {
    if (
      !confirm(
        `Tem certeza que deseja EXCLUIR permanentemente o colaborador "${nomeColaborador}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados relacionados.`,
      )
    ) {
      return
    }

    const confirmacao = prompt(`Para confirmar a exclusão, digite "EXCLUIR" (em maiúsculas):`)
    if (confirmacao !== "EXCLUIR") {
      setError("Exclusão cancelada - confirmação incorreta")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/colaboradores/${colaboradorId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador excluído com sucesso!")
        carregarDados()
      } else {
        setError(data.error || "Erro ao excluir colaborador")
      }
    } catch (err) {
      setError("Erro ao excluir colaborador")
    } finally {
      setLoading(false)
    }
  }

  const processarImportacaoColaboradores = async () => {
    if (!importacaoColaboradores.arquivo) {
      alert("Por favor, selecione um arquivo Excel")
      return
    }

    setImportacaoColaboradores((prev) => ({ ...prev, processando: true, resultado: null }))

    try {
      const formData = new FormData()
      formData.append("arquivo", importacaoColaboradores.arquivo)

      const response = await fetch("/api/admin/importar-colaboradores-excel", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const resultado = await response.json()
      setImportacaoColaboradores((prev) => ({ ...prev, resultado }))

      // Recarregar lista de colaboradores
      carregarDados()
    } catch (error) {
      console.error("Erro ao processar arquivo Excel:", error)
      alert(`Erro ao processar arquivo: ${error.message}`)
    } finally {
      setImportacaoColaboradores((prev) => ({ ...prev, processando: false }))
    }
  }

  const carregarColaboradores = async () => {
    try {
      const colaboradoresRes = await fetch("/api/admin/colaboradores")
      if (colaboradoresRes.ok) {
        const colaboradoresData = await colaboradoresRes.json()
        setColaboradores(colaboradoresData)
      }
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error)
    }
  }

  const baixarModeloPlanilha = () => {
    try {
      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new()

      // Dados do modelo com cabeçalhos e exemplo
      const dadosModelo = [
        ["Crachá", "Nome Completo", "Cargo", "Líder", "Saldo Final"],
        ["12345", "João Silva Santos", "Analista", "Maria Oliveira", "8:30"],
        ["67890", "Ana Costa Lima", "Desenvolvedor", "Carlos Santos", "-2:15"],
        ["11111", "Pedro Souza", "Gerente", "Diretoria", "40:00"],
      ]

      // Criar worksheet
      const ws = XLSX.utils.aoa_to_sheet(dadosModelo)

      // Definir largura das colunas
      ws["!cols"] = [
        { wch: 10 }, // Crachá
        { wch: 25 }, // Nome Completo
        { wch: 15 }, // Cargo
        { wch: 20 }, // Líder
        { wch: 12 }, // Saldo Final
      ]

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação Horas")

      // Gerar dados do arquivo em memória
      const dadosArquivo = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Criar blob e URL para download
      const blob = new Blob([dadosArquivo], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      // Criar link temporário para download
      const link = document.createElement("a")
      link.href = url
      link.download = `modelo_importacao_horas_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()

      // Limpar recursos
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("[v0] Modelo da planilha baixado com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao gerar modelo da planilha:", error)
      alert("Erro ao gerar modelo da planilha. Tente novamente.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!adminAuth) {
    return null // Será redirecionado para login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-emerald-600/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent_50%)]"></div>

      <div className="relative z-10 p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-sm sm:text-base text-blue-100/80">Gerenciamento do sistema de banco de horas</p>
                  <p className="text-xs sm:text-sm text-blue-200/70 mt-1">
                    Logado como:{" "}
                    <span className="font-medium text-blue-100">
                      {adminAuth?.nome_completo || adminAuth?.usuario || "Administrador"}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-100 backdrop-blur-sm transition-all duration-300 self-start sm:self-auto"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 sm:mb-6 bg-red-500/10 border-red-400/30 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm text-red-100">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 sm:mb-6 bg-emerald-500/10 border-emerald-400/30 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-100 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="colaboradores"
            className="space-y-4 sm:space-y-6"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-10 min-w-[1200px] sm:min-w-0 h-auto p-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                <TabsTrigger
                  value="colaboradores"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Colaboradores</span>
                  <span className="xs:hidden">Colab.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cadastro"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Cadastro</span>
                  <span className="xs:hidden">Cad.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="horas"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Lançar Horas</span>
                  <span className="xs:hidden">Horas</span>
                </TabsTrigger>
                <TabsTrigger
                  value="agendamento"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Agendamento</span>
                  <span className="xs:hidden">Agenda</span>
                </TabsTrigger>
                <TabsTrigger
                  value="desbloqueio"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Unlock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Desbloqueio</span>
                  <span className="xs:hidden">Desbl.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analise"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Análise</span>
                  <span className="xs:hidden">Análise</span>
                </TabsTrigger>
                <TabsTrigger
                  value="adm"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">ADM</span>
                  <span className="xs:hidden">ADM</span>
                </TabsTrigger>
                <TabsTrigger
                  value="solicitacoes"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Solicitações</span>
                  <span className="xs:hidden">Solicitações</span>
                </TabsTrigger>
                <TabsTrigger
                  value="log-atividades"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Log Atividades</span>
                  <span className="xs:hidden">Log</span>
                </TabsTrigger>
                <TabsTrigger
                  value="manutencao"
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm text-white/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/10"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Manutenção</span>
                  <span className="xs:hidden">Manut.</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Colaboradores Tab */}
            <TabsContent value="colaboradores">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Lista de Colaboradores
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-100/80">
                    Visualize e gerencie todos os colaboradores cadastrados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {colaboradores.length === 0 ? (
                      <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                        Nenhum colaborador cadastrado
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {colaboradores.map((colaborador) => (
                          <div
                            key={colaborador.id}
                            className="flex flex-col p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl gap-3 sm:gap-4 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm sm:text-base truncate text-white">
                                    {colaborador.nome}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-100/70">Crachá: {colaborador.cracha}</p>
                                  <div className="sm:hidden mt-1 space-y-1">
                                    <p className="text-xs text-blue-100/60">{colaborador.cargo}</p>
                                    <p className="text-xs text-blue-100/60">Sup: {colaborador.supervisor}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {colaborador.bloqueado ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs bg-red-500/20 text-red-200 border-red-400/30"
                                  >
                                    Bloqueado
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                                  >
                                    Ativo
                                  </Badge>
                                )}
                                {colaborador.tentativas_codigo > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                                  >
                                    {colaborador.tentativas_codigo}/3 tentativas
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                              <Button
                                size="sm"
                                onClick={() => editarColaborador(colaborador)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => bloquearDesbloquearColaborador(colaborador.id, !colaborador.bloqueado)}
                                className={`text-white text-xs px-3 py-1 h-8 ${
                                  colaborador.bloqueado
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-orange-600 hover:bg-orange-700"
                                }`}
                              >
                                {colaborador.bloqueado ? (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Desbloquear
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Bloquear
                                  </>
                                )}
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => excluirColaborador(colaborador.id, colaborador.nome)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-8"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cadastro Tab */}
            <TabsContent value="cadastro">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-emerald-400" />
                    {editandoColaborador ? "Editar Colaborador" : "Cadastrar Novo Colaborador"}
                  </CardTitle>
                  <CardDescription className="text-sm text-emerald-100/80">
                    {editandoColaborador
                      ? "Atualize os dados do colaborador"
                      : "Adicione um novo colaborador ao sistema"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {editandoColaborador && (
                    <div className="flex justify-end">
                      <Button
                        onClick={cancelarEdicaoColaborador}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Cancelar Edição
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-sm font-medium text-white">
                        Nome Completo *
                      </Label>
                      <Input
                        id="nome"
                        value={novoColaborador.nome}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })}
                        placeholder="Ex: João Silva Santos"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cracha" className="text-sm font-medium text-white">
                        Número do Crachá *
                      </Label>
                      <Input
                        id="cracha"
                        value={novoColaborador.cracha}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, cracha: e.target.value })}
                        placeholder="Ex: 001"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento" className="text-sm font-medium text-white">
                        Data de Nascimento *
                      </Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={novoColaborador.dataNascimento}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, dataNascimento: e.target.value })}
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-sm font-medium text-white">
                        Telefone *
                      </Label>
                      <Input
                        id="telefone"
                        value={novoColaborador.telefone}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, telefone: e.target.value })}
                        placeholder="+55 (11) 99999-9999"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cargo" className="text-sm font-medium text-white">
                        Cargo *
                      </Label>
                      <select
                        id="cargo"
                        className="w-full p-2 sm:p-3 border rounded-md bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        value={novoColaborador.cargo}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, cargo: e.target.value })}
                      >
                        <option value="">Escolha uma opção</option>
                        <option value="Operador Empilhadeira">Operador Empilhadeira</option>
                        <option value="Operador de Transpaleteira">Operador de Transpaleteira</option>
                        <option value="Auxiliar">Auxiliar</option>
                        <option value="Conferente II">Conferente II</option>
                        <option value="Conferente I">Conferente I</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Controlador">Controlador</option>
                        <option value="Assistente Administrativo">Assistente Administrativo</option>
                        <option value="Analista Jr">Analista Jr</option>
                        <option value="Assistente">Assistente</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisor" className="text-sm font-medium text-white">
                        Supervisor *
                      </Label>
                      <select
                        id="supervisor"
                        className="w-full p-2 sm:p-3 border rounded-md bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        value={novoColaborador.supervisor}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, supervisor: e.target.value })}
                      >
                        <option value="">Escolha uma opção</option>
                        <option value="Welton Andrade">Welton Andrade</option>
                        <option value="Arlem Brito">Arlem Brito</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="turno" className="text-sm font-medium text-white">
                        Turno *
                      </Label>
                      <select
                        id="turno"
                        className="w-full p-2 sm:p-3 border rounded-md bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        value={novoColaborador.turno}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, turno: e.target.value })}
                      >
                        <option value="">Escolha uma opção</option>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoTemporario" className="text-sm font-medium text-white">
                        Código Temporário *
                      </Label>
                      <Input
                        id="codigoTemporario"
                        type="text"
                        value={novoColaborador.codigoTemporario}
                        onChange={(e) => setNovoColaborador({ ...novoColaborador, codigoTemporario: e.target.value })}
                        placeholder="Código para primeiro acesso"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                      <p className="text-xs text-yellow-300/80">
                        Este código será usado pelo colaborador no primeiro acesso. Após isso, ele criará seu próprio
                        código fixo.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={editandoColaborador ? atualizarColaborador : cadastrarColaborador}
                    disabled={loading}
                    className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {editandoColaborador ? "Atualizando..." : "Cadastrando..."}
                      </div>
                    ) : editandoColaborador ? (
                      "Atualizar Colaborador"
                    ) : (
                      "Cadastrar Colaborador"
                    )}
                  </Button>

                  <div className="border-t border-white/20 pt-6 mt-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-400" />
                        Importação em Lote via Excel
                      </h3>
                      <p className="text-sm text-emerald-100/80">
                        Importe múltiplos colaboradores de uma vez usando um arquivo Excel
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-300 mb-2">Formato do Arquivo Excel:</h4>
                        <div className="text-xs text-blue-200/80 space-y-1">
                          <p>
                            <strong>Colunas obrigatórias:</strong>
                          </p>
                          <p>• Crachá | Nome | Cargo</p>
                          <p>
                            <strong>Observação:</strong> Apenas os campos Crachá, Nome e Cargo são processados
                          </p>
                          <p>
                            <strong>Outros campos:</strong> CPF, Admissão e Situação são ignorados (não suportados pela
                            estrutura atual)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-white mb-2 block">Selecionar Arquivo Excel</Label>
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) =>
                              setImportacaoColaboradores((prev) => ({
                                ...prev,
                                arquivo: e.target.files?.[0] || null,
                                resultado: null,
                              }))
                            }
                            className="w-full p-3 border border-white/20 rounded-md bg-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                          />
                        </div>

                        {importacaoColaboradores.arquivo && (
                          <div className="text-sm text-emerald-200">
                            Arquivo selecionado: {importacaoColaboradores.arquivo.name}
                          </div>
                        )}

                        <Button
                          onClick={processarImportacaoColaboradores}
                          disabled={!importacaoColaboradores.arquivo || importacaoColaboradores.processando}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          {importacaoColaboradores.processando ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processando arquivo...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Importar Colaboradores
                            </div>
                          )}
                        </Button>
                      </div>

                      {/* Resultado da Importação */}
                      {importacaoColaboradores.resultado && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium text-white">Resultado da Importação:</h4>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                              <div className="text-lg font-bold text-green-300">
                                {importacaoColaboradores.resultado.processados || 0}
                              </div>
                              <div className="text-xs text-green-200">Processados</div>
                            </div>
                            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                              <div className="text-lg font-bold text-red-300">
                                {importacaoColaboradores.resultado.erros || 0}
                              </div>
                              <div className="text-xs text-red-200">Erros</div>
                            </div>
                            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                              <div className="text-lg font-bold text-blue-300">
                                {importacaoColaboradores.resultado.total || 0}
                              </div>
                              <div className="text-xs text-blue-200">Total</div>
                            </div>
                          </div>

                          {importacaoColaboradores.resultado.detalhes && (
                            <div className="text-xs text-white/70 bg-black/20 rounded p-3 max-h-32 overflow-y-auto">
                              <pre>{importacaoColaboradores.resultado.detalhes}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lançar Horas Tab */}
            <TabsContent value="horas">
              <div className="grid gap-4 sm:gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                    <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-400" />
                      Lançar Horas
                    </CardTitle>
                    <CardDescription className="text-sm text-purple-100/80">
                      Registre horas trabalhadas ou ajustes para colaboradores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="colaborador" className="text-sm font-medium text-white">
                          Colaborador
                        </Label>
                        <select
                          id="colaborador"
                          className="w-full p-2 sm:p-3 border rounded-md bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                          value={lancamentoHoras.colaboradorId}
                          onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, colaboradorId: e.target.value })}
                        >
                          <option value="" className="bg-gray-800 text-white">
                            Selecione um colaborador
                          </option>
                          {colaboradores.map((colaborador) => (
                            <option key={colaborador.id} value={colaborador.id} className="bg-gray-800 text-white">
                              {colaborador.nome || "Nome não informado"} - Crachá: {colaborador.cracha || "N/A"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="horas" className="text-sm font-medium text-white">
                          Horas (use - para negativo)
                        </Label>
                        <Input
                          id="horas"
                          type="number"
                          value={lancamentoHoras.horas}
                          onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, horas: e.target.value })}
                          placeholder="Ex: 8 ou -2"
                          className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motivo" className="text-sm font-medium text-white">
                        Motivo (opcional)
                      </Label>
                      <Textarea
                        id="motivo"
                        value={lancamentoHoras.motivo}
                        onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, motivo: e.target.value })}
                        placeholder="Descreva o motivo do lançamento..."
                        className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mensagemPopup" className="text-sm font-medium text-white">
                        Mensagem para Popup (opcional)
                      </Label>
                      <Textarea
                        id="mensagemPopup"
                        value={lancamentoHoras.mensagemPopup}
                        onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, mensagemPopup: e.target.value })}
                        placeholder="Mensagem que aparecerá no popup para o colaborador..."
                        className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                      <p className="text-xs text-purple-200/70">
                        Esta mensagem aparecerá em um popup quando o colaborador acessar o painel
                      </p>
                    </div>
                    <Button
                      onClick={lancarHoras}
                      disabled={loading}
                      className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? "Lançando..." : "Lançar Horas"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-400/30 backdrop-blur-sm">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Importar Horas via Excel
                      <button
                        onClick={baixarModeloPlanilha}
                        className="ml-auto p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 transition-colors group"
                        title="Baixar modelo da planilha Excel"
                      >
                        <Download className="w-4 h-4 text-green-300 group-hover:text-green-200" />
                      </button>
                    </CardTitle>
                    <CardDescription className="text-sm text-purple-100/80">
                      Importe horas em lote através de arquivo Excel
                      <span className="block text-xs text-green-300/80 mt-1">
                        💡 Clique no ícone de download para baixar o modelo da planilha
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Formato do Arquivo Excel</h4>
                      <p className="text-xs text-blue-200/80 mb-3">
                        O arquivo deve conter os seguintes campos para cada colaborador:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-200">Crachá</div>
                        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-200">Nome Completo</div>
                        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-200">Cargo</div>
                        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-200">Líder</div>
                        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-200">Saldo Final</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="arquivo-excel" className="text-sm font-medium text-white">
                          Selecionar Arquivo Excel
                        </Label>
                        <div className="relative">
                          <input
                            id="arquivo-excel"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setImportacaoExcel((prev) => ({ ...prev, arquivo: file, resultado: null }))
                            }}
                            className="w-full p-3 border rounded-md bg-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                          />
                        </div>
                        {importacaoExcel.arquivo && (
                          <p className="text-xs text-green-300">Arquivo selecionado: {importacaoExcel.arquivo.name}</p>
                        )}
                      </div>

                      {importacaoExcel.processando && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-white">
                            <span>Processando arquivo...</span>
                            <span>{importacaoExcel.progresso}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${importacaoExcel.progresso}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {importacaoExcel.resultado && (
                        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-green-300 mb-2">Resultado da Importação</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="text-center">
                              <button
                                onClick={() =>
                                  setModalDetalhes({
                                    aberto: true,
                                    tipo: "processados",
                                    dados: importacaoExcel.resultado.detalhesProcessados || [],
                                  })
                                }
                                className="hover:bg-green-500/20 rounded-lg p-2 transition-colors w-full"
                              >
                                <div className="text-lg font-bold text-green-300">
                                  {importacaoExcel.resultado.processados}
                                </div>
                                <div className="text-green-200/80">Processados</div>
                              </button>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-300">{importacaoExcel.resultado.total}</div>
                              <div className="text-blue-200/80">Total</div>
                            </div>
                            <div className="text-center">
                              <button
                                onClick={() =>
                                  setModalDetalhes({
                                    aberto: true,
                                    tipo: "erros",
                                    dados: importacaoExcel.resultado.detalhesErros || [],
                                  })
                                }
                                className="hover:bg-yellow-500/20 rounded-lg p-2 transition-colors w-full"
                                disabled={!importacaoExcel.resultado.erros}
                              >
                                <div className="text-lg font-bold text-yellow-300">
                                  {importacaoExcel.resultado.erros || 0}
                                </div>
                                <div className="text-yellow-200/80">Erros</div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={processarImportacaoExcel}
                        disabled={!importacaoExcel.arquivo || importacaoExcel.processando}
                        className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importacaoExcel.processando ? "Processando..." : "Importar Horas"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                    <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-teal-400" />
                      Histórico Recente
                    </CardTitle>
                    <CardDescription className="text-sm text-teal-100/80">
                      Últimos lançamentos realizados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {historico.length === 0 ? (
                      <p className="text-blue-100/60 text-center py-4 text-sm sm:text-base">
                        Nenhum lançamento encontrado
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                        {historico.slice(0, 10).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-white/5 border border-white/10 rounded-lg gap-2 sm:gap-4 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate text-white">
                                {item.colaborador_nome}
                              </p>
                              <p className="text-xs sm:text-sm text-blue-100/70">
                                {formatarData(item.data_lancamento)}
                              </p>
                              {item.motivo && (
                                <p className="text-xs sm:text-sm text-blue-100/80 mt-1 break-words">{item.motivo}</p>
                              )}
                              <p className="text-xs text-blue-100/60 mt-1">Por: {item.criado_por}</p>
                            </div>
                            <Badge
                              variant={item.horas >= 0 ? "default" : "destructive"}
                              className="text-xs self-start sm:self-auto sm:ml-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                            >
                              {formatarHoras(item.horas)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {modalDetalhes.aberto && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                      <div className="p-6 border-b border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-white">
                            Detalhes -{" "}
                            {modalDetalhes.tipo === "processados" ? "Registros Processados" : "Erros Encontrados"}
                          </h3>
                          <button
                            onClick={() => setModalDetalhes({ aberto: false, tipo: "processados", dados: [] })}
                            className="text-gray-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {modalDetalhes.tipo === "processados" ? (
                          <div className="space-y-3">
                            {modalDetalhes.dados.map((item, index) => (
                              <div key={index} className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-green-300 font-medium">Linha:</span>
                                    <span className="text-white ml-2">{item.linha}</span>
                                  </div>
                                  <div>
                                    <span className="text-green-300 font-medium">Crachá:</span>
                                    <span className="text-white ml-2">{item.cracha}</span>
                                  </div>
                                  <div>
                                    <span className="text-green-300 font-medium">Nome:</span>
                                    <span className="text-white ml-2">{item.nome}</span>
                                  </div>
                                  <div>
                                    <span className="text-green-300 font-medium">Saldo:</span>
                                    <span className="text-white ml-2">{item.saldo}</span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-green-300 font-medium">Status:</span>
                                    <span className="text-green-400 ml-2">✓ Processado com sucesso</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {modalDetalhes.dados.map((erro, index) => (
                              <div key={index} className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-300 font-medium">Linha {erro.linha}:</span>
                                    <span className="text-red-400">✗ {erro.erro}</span>
                                  </div>
                                  {erro.dados && (
                                    <div className="text-sm text-gray-300 bg-gray-800/50 rounded p-2">
                                      <strong>Dados da linha:</strong> {JSON.stringify(erro.dados, null, 2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Agendamento Tab */}
            <TabsContent value="agendamento">
              <div className="grid gap-4 sm:gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                    <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-purple-400" />
                      Solicitações de Recuperação de Código
                    </CardTitle>
                    <CardDescription className="text-sm text-purple-100/80">
                      Aprove ou recuse as solicitações de recuperação de código de acesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {solicitacoesRecuperacao.filter((s) => s.status === "pendente").length === 0 ? (
                      <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                        Nenhuma solicitação pendente
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {solicitacoesRecuperacao
                          .filter((s) => s.status === "pendente")
                          .map((solicitacao) => (
                            <div
                              key={solicitacao.id}
                              className="p-4 border border-white/10 rounded-lg bg-purple-50/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                    <h3 className="font-semibold text-sm sm:text-base text-white">
                                      {solicitacao.colaborador_nome}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className="text-xs self-start sm:self-auto bg-white/10 border-white/20 text-white"
                                    >
                                      Crachá {solicitacao.cracha}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-blue-100/70 mb-3">
                                    <p>
                                      <strong>Nome informado:</strong> {solicitacao.nome_completo}
                                    </p>
                                    <p>
                                      <strong>Cargo informado:</strong> {solicitacao.cargo}
                                    </p>
                                    <p>
                                      <strong>Empresa informada:</strong> {solicitacao.empresa}
                                    </p>
                                    <p>
                                      <strong>Supervisor informado:</strong> {solicitacao.nome_supervisor}
                                    </p>
                                    <p>
                                      <strong>Solicitado em:</strong> {formatarData(solicitacao.criada_em)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => processarSolicitacaoRecuperacao(solicitacao.id, "aprovar")}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 flex-1 lg:flex-none text-xs sm:text-sm text-white rounded-lg transition-all duration-300"
                                  >
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      const motivo = prompt("Motivo da recusa (opcional):")
                                      processarSolicitacaoRecuperacao(solicitacao.id, "recusar", motivo || undefined)
                                    }}
                                    disabled={loading}
                                    className="flex-1 lg:flex-none text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
                                  >
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                    <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-400" />
                      Solicitações de Folga Pendentes
                    </CardTitle>
                    <CardDescription className="text-sm text-orange-100/80">
                      Visualize e processe as solicitações de folga pendentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {solicitacoesFolga.filter((s) => s.status === "pendente").length === 0 ? (
                      <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                        Nenhuma solicitação de folga pendente
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {solicitacoesFolga
                          .filter((s) => s.status === "pendente")
                          .map((solicitacao) => (
                            <div
                              key={solicitacao.id}
                              className="p-4 border border-white/10 rounded-lg bg-orange-50/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                    <h3 className="font-semibold text-sm sm:text-base text-white">
                                      {solicitacao.colaborador_nome}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className="text-xs self-start sm:self-auto bg-white/10 border-white/20 text-white"
                                    >
                                      Crachá {solicitacao.colaborador_cracha}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-blue-100/70 mb-3">
                                    <p>
                                      <strong>Data da Folga:</strong> {formatarData(solicitacao.data_folga)}
                                    </p>
                                    <p>
                                      <strong>Dia da Semana:</strong> {solicitacao.dia_semana}
                                    </p>
                                    <p>
                                      <strong>Horas a Debitar:</strong> {solicitacao.horas_debitar}h
                                    </p>
                                    <p>
                                      <strong>Motivo:</strong> {solicitacao.motivo}
                                    </p>
                                    <p>
                                      <strong>Solicitado em:</strong> {formatarData(solicitacao.data_solicitacao)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => processarSolicitacaoFolga(solicitacao.id, "aprovada")}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 flex-1 lg:flex-none text-xs sm:text-sm text-white rounded-lg transition-all duration-300"
                                  >
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => processarSolicitacaoFolga(solicitacao.id, "recusada")}
                                    disabled={loading}
                                    className="flex-1 lg:flex-none text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
                                  >
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Desbloqueio Tab */}
            <TabsContent value="desbloqueio">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-rose-400" />
                    Desbloquear Colaborador
                  </CardTitle>
                  <CardDescription className="text-sm text-rose-100/80">
                    Desbloqueie colaboradores que foram temporariamente bloqueados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {pinsDesbloqueio.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">PINs de Desbloqueio Pendentes</h3>
                      <div className="space-y-3">
                        {pinsDesbloqueio.map((pin) => (
                          <div key={pin.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">{pin.colaborador_nome}</p>
                                <p className="text-white/70 text-sm">Crachá: {pin.colaborador_cracha}</p>
                                <p className="text-rose-300 font-mono text-lg">PIN: {pin.pin}</p>
                                <p className="text-white/50 text-xs">
                                  Gerado em: {new Date(pin.criado_em).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <Button
                                onClick={() => setTokenDesbloqueio({ ...tokenDesbloqueio, token: pin.pin })}
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                                size="sm"
                              >
                                Usar PIN
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-sm font-medium text-white">
                        Token de Desbloqueio *
                      </Label>
                      <Input
                        id="token"
                        value={tokenDesbloqueio.token}
                        onChange={(e) => setTokenDesbloqueio({ ...tokenDesbloqueio, token: e.target.value })}
                        placeholder="Token recebido pelo colaborador"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="novoCodigoAcesso" className="text-sm font-medium text-white">
                        Novo Código de Acesso *
                      </Label>
                      <Input
                        id="novoCodigoAcesso"
                        value={tokenDesbloqueio.novoCodigoAcesso}
                        onChange={(e) => setTokenDesbloqueio({ ...tokenDesbloqueio, novoCodigoAcesso: e.target.value })}
                        placeholder="Novo código para acesso"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={desbloquearColaborador}
                    disabled={loading}
                    className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? "Desbloqueando..." : "Desbloquear Colaborador"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {activeTab === "analise" && (
              <div className="space-y-6">
                {/* Cards de Resumo - Clicáveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => buscarColaboradoresPorCategoria("horasPositivas")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Horas Positivas</p>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.floor(dadosAnalise.horasPositivas / 60)}h {dadosAnalise.horasPositivas % 60}m
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => buscarColaboradoresPorCategoria("horasNegativas")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Horas Negativas</p>
                          <p className="text-2xl font-bold text-red-600">
                            {Math.floor(Math.abs(dadosAnalise.horasNegativas) / 60)}h{" "}
                            {Math.abs(dadosAnalise.horasNegativas) % 60}m
                          </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => buscarColaboradoresPorCategoria("colabPositivos")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Colab. Positivos</p>
                          <p className="text-2xl font-bold text-green-600">{dadosAnalise.colaboradoresPositivos}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => buscarColaboradoresPorCategoria("colabNegativos")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Colab. Negativos</p>
                          <p className="text-2xl font-bold text-red-600">{dadosAnalise.colaboradoresNegativos}</p>
                        </div>
                        <UserX className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista Expansível com Animação Suave */}
                {listaVisivel.tipo && (
                  <div className="animate-in slide-in-from-top-4 duration-500">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {listaVisivel.tipo === "horasPositivas" && (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            )}
                            {listaVisivel.tipo === "horasNegativas" && (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                            {listaVisivel.tipo === "colabPositivos" && <Users className="h-5 w-5 text-green-600" />}
                            {listaVisivel.tipo === "colabNegativos" && <UserX className="h-5 w-5 text-red-600" />}
                            {listaVisivel.tipo === "horasPositivas" && "Colaboradores com Horas Positivas"}
                            {listaVisivel.tipo === "horasNegativas" && "Colaboradores com Horas Negativas"}
                            {listaVisivel.tipo === "colabPositivos" && "Colaboradores com Saldo Positivo"}
                            {listaVisivel.tipo === "colabNegativos" && "Colaboradores com Saldo Negativo"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {listaVisivel.dados.length} colaborador(es) encontrado(s)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => gerarRelatorioPDF(listaVisivel.tipo!, listaVisivel.dados)}
                            className="flex items-center gap-2"
                            variant="outline"
                          >
                            <FileTextIcon className="h-4 w-4" />
                            Gerar PDF
                          </Button>
                          <Button onClick={() => setListaVisivel({ tipo: null, dados: [] })} variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {listaVisivel.dados.map((colaborador, index) => (
                            <div
                              key={colaborador.cracha}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-in fade-in duration-300"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">{colaborador.cracha}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{colaborador.nome}</p>
                                  <p className="text-sm text-muted-foreground">Crachá: {colaborador.cracha}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-bold ${colaborador.status === "positivo" ? "text-green-600" : "text-red-600"}`}
                                >
                                  {colaborador.status === "positivo" ? "+" : ""}
                                  {Math.floor(Math.abs(colaborador.horas) / 60)}h {Math.abs(colaborador.horas) % 60}m
                                </p>
                                <p className="text-xs text-muted-foreground">{colaborador.horas} minutos</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Seção de Gráficos Detalhados */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gráfico Redondo - Horas Negativas */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                    <CardHeader className="p-4 border-b border-white/10">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-red-400" />
                        Horas Negativas
                      </CardTitle>
                      <CardDescription className="text-sm text-red-100/80">
                        Distribuição do saldo negativo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Horas Negativas",
                                  value: Math.abs(dadosAnalise.horasNegativas),
                                  fill: "#ef4444",
                                },
                                {
                                  name: "Restante",
                                  value: Math.max(0, 100 - Math.abs(dadosAnalise.horasNegativas)),
                                  fill: "#374151",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              startAngle={90}
                              endAngle={450}
                              dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill="#374151" />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(0,0,0,0.8)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                color: "white",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">
                              {Math.abs(dadosAnalise.horasNegativas).toFixed(1)}h
                            </div>
                            <div className="text-sm text-red-200/80">Negativas</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico Redondo - Horas Positivas */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                    <CardHeader className="p-4 border-b border-white/10">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-green-400" />
                        Horas Positivas
                      </CardTitle>
                      <CardDescription className="text-sm text-green-100/80">
                        Distribuição do saldo positivo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Horas Positivas",
                                  value: dadosAnalise.horasPositivas,
                                  fill: "#10b981",
                                },
                                {
                                  name: "Restante",
                                  value: Math.max(0, 200 - dadosAnalise.horasPositivas),
                                  fill: "#374151",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              startAngle={90}
                              endAngle={450}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#374151" />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(0,0,0,0.8)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                color: "white",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {dadosAnalise.horasPositivas.toFixed(1)}h
                            </div>
                            <div className="text-sm text-green-200/80">Positivas</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Barras - Horas Mensais */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                    <CardHeader className="p-4 border-b border-white/10">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-cyan-400" />
                        Horas Mensais
                      </CardTitle>
                      <CardDescription className="text-sm text-cyan-100/80">
                        Total de horas positivas por mês
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { mes: "JAN", horas: 45.5, extras: 8.2 },
                              { mes: "FEV", horas: 52.3, extras: 12.1 },
                              { mes: "MAR", horas: 38.7, extras: 5.4 },
                              { mes: "ABR", horas: 41.2, extras: 7.8 },
                              { mes: "MAI", horas: 48.9, extras: 11.3 },
                              { mes: "JUN", horas: 44.1, extras: 6.7 },
                              { mes: "JUL", horas: 39.8, extras: 4.9 },
                              { mes: "AGO", horas: 46.5, extras: 9.2 },
                              { mes: "SET", horas: 43.7, extras: 8.1 },
                              { mes: "OUT", horas: 47.2, extras: 10.5 },
                              { mes: "NOV", horas: 42.8, extras: 7.3 },
                              { mes: "DEZ", horas: 40.3, extras: 6.8 },
                            ]}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" fontSize={10} tick={{ fontSize: 10 }} />
                            <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(0,0,0,0.8)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "12px",
                              }}
                              formatter={(value, name) => [
                                `${value}h`,
                                name === "horas" ? "Horas Trabalhadas" : "Horas Extras",
                              ]}
                            />
                            <Bar dataKey="horas" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="extras" fill="#0891b2" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                          <span className="text-xs text-white/70">Horas Trabalhadas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-cyan-600 rounded"></div>
                          <span className="text-xs text-white/70">Horas Extras</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de barras */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="p-4 border-b border-white/10">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-cyan-400" />
                      Saldo de Horas por Colaborador
                    </CardTitle>
                    <CardDescription className="text-sm text-cyan-100/80">
                      Saldo individual de cada colaborador
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dadosAnalise.colaboradoresDetalhados?.map((colaborador) => ({
                            nome: colaborador.nome,
                            saldo: colaborador.saldoHoras,
                          }))}
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis
                            dataKey="nome"
                            stroke="rgba(255,255,255,0.7)"
                            fontSize={10}
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0,0,0,0.8)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: "8px",
                              color: "white",
                              fontSize: "12px",
                            }}
                            formatter={(value) => [`${value}h`, "Saldo"]}
                          />
                          <Bar dataKey="saldo" fill="#64748b" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ADM Tab */}
            <TabsContent value="adm">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    Gerenciar Administradores
                  </CardTitle>
                  <CardDescription className="text-sm text-yellow-100/80">
                    Cadastre, edite e gerencie os administradores do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome_completo" className="text-sm font-medium text-white">
                        Nome Completo *
                      </Label>
                      <Input
                        id="nome_completo"
                        value={novoAdmin.nome_completo}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, nome_completo: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cracha_admin" className="text-sm font-medium text-white">
                        Número do Crachá *
                      </Label>
                      <Input
                        id="cracha_admin"
                        value={novoAdmin.cracha}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, cracha: e.target.value })}
                        placeholder="Ex: 001"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-sm font-medium text-white">
                        CPF *
                      </Label>
                      <Input
                        id="cpf"
                        value={novoAdmin.cpf}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, cpf: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone_admin" className="text-sm font-medium text-white">
                        Telefone *
                      </Label>
                      <Input
                        id="telefone_admin"
                        value={novoAdmin.telefone}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, telefone: e.target.value })}
                        placeholder="+55 (11) 99999-9999"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cargo_admin" className="text-sm font-medium text-white">
                        Cargo *
                      </Label>
                      <Input
                        id="cargo_admin"
                        value={novoAdmin.cargo}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, cargo: e.target.value })}
                        placeholder="Ex: Analista de Sistemas"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empresa" className="text-sm font-medium text-white">
                        Empresa *
                      </Label>
                      <Input
                        id="empresa"
                        value={novoAdmin.empresa}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, empresa: e.target.value })}
                        placeholder="Ex: Empresa X"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="usuario" className="text-sm font-medium text-white">
                        Usuário *
                      </Label>
                      <Input
                        id="usuario"
                        value={novoAdmin.usuario}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, usuario: e.target.value })}
                        placeholder="Ex: joao.silva"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha" className="text-sm font-medium text-white">
                        Senha *
                      </Label>
                      <Input
                        id="senha"
                        type="password"
                        value={novoAdmin.senha || ""}
                        onChange={(e) => setNovoAdmin({ ...novoAdmin, senha: e.target.value })}
                        placeholder="Senha de acesso"
                        className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permissoes" className="text-sm font-medium text-white">
                      Permissões (opcional)
                    </Label>
                    <Input
                      id="permissoes"
                      value={novoAdmin.permissoes || ""}
                      onChange={(e) => setNovoAdmin({ ...novoAdmin, permissoes: e.target.value })}
                      placeholder="Ex: acesso_total,gerenciar_usuarios"
                      className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                    />
                    <p className="text-xs text-yellow-300/80">
                      Separe as permissões por vírgula. Ex: visualizar_logs,editar_colaboradores
                    </p>
                  </div>

                  <div className="flex justify-between">
                    {editandoAdmin && (
                      <Button
                        onClick={cancelarEdicao}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Cancelar Edição
                      </Button>
                    )}
                    <Button
                      onClick={cadastrarAdministrador}
                      disabled={loading}
                      className="py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {editandoAdmin ? "Atualizando..." : "Cadastrando..."}
                        </div>
                      ) : editandoAdmin ? (
                        "Atualizar Administrador"
                      ) : (
                        "Cadastrar Administrador"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-yellow-400" />
                    Lista de Administradores
                  </CardTitle>
                  <CardDescription className="text-sm text-yellow-100/80">
                    Visualize e gerencie todos os administradores cadastrados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {administradores.length === 0 ? (
                      <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                        Nenhum administrador cadastrado
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {administradores.map((admin) => (
                          <div
                            key={admin.id}
                            className="flex flex-col p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl gap-3 sm:gap-4 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm sm:text-base truncate text-white">
                                    {admin.nome_completo}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-100/70">Crachá: {admin.cracha}</p>
                                  <div className="sm:hidden mt-1 space-y-1">
                                    <p className="text-xs text-blue-100/60">{admin.cargo}</p>
                                    <p className="text-xs text-blue-100/60">Empresa: {admin.empresa}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                              <Button
                                size="sm"
                                onClick={() => testarLogin(admin.usuario, "senha_padrao")}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                              >
                                <Key className="h-3 w-3 mr-1" />
                                Testar Login
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => editarAdministrador(admin)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Solicitações Tab */}
            <TabsContent value="solicitacoes">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Solicitações de Recuperação
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-100/80">
                    Gerencie as solicitações de recuperação de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {solicitacoesRecuperacao.length === 0 ? (
                      <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                        Nenhuma solicitação de recuperação encontrada
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {solicitacoesRecuperacao.map((solicitacao) => (
                          <div
                            key={solicitacao.id}
                            className="flex flex-col p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl gap-3 sm:gap-4 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm sm:text-base truncate text-white">
                                    {solicitacao.colaborador_nome}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-100/70">Crachá: {solicitacao.cracha}</p>
                                  <div className="sm:hidden mt-1 space-y-1">
                                    <p className="text-xs text-blue-100/60">Cargo: {solicitacao.cargo}</p>
                                    <p className="text-xs text-blue-100/60">
                                      Supervisor: {solicitacao.nome_supervisor}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={
                                    solicitacao.status === "aprovada"
                                      ? "default"
                                      : solicitacao.status === "recusada"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {solicitacao.status === "aprovada"
                                    ? "Aprovada"
                                    : solicitacao.status === "recusada"
                                      ? "Recusada"
                                      : "Pendente"}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                              {solicitacao.status === "pendente" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => processarSolicitacaoRecuperacao(solicitacao.id, "aprovar")}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-8"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const motivo = prompt("Motivo da recusa (opcional):")
                                      processarSolicitacaoRecuperacao(solicitacao.id, "recusar", motivo || undefined)
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-8"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Recusar
                                  </Button>
                                </>
                              )}
                              {solicitacao.status === "aprovada" && (
                                <Button
                                  size="sm"
                                  onClick={() => usarSolicitacaoParaDesbloqueio(solicitacao)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-8"
                                >
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Usar para Desbloqueio
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Log de Atividades Tab */}
            <TabsContent value="log-atividades">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader className="p-4 sm:p-6 border-b border-white/10">
                  <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-400" />
                    Log de Atividades
                  </CardTitle>
                  <CardDescription className="text-sm text-teal-100/80">
                    Acompanhe as atividades realizadas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tipoAtividade" className="text-sm font-medium text-white">
                          Tipo de Atividade
                        </Label>
                        <select
                          id="tipoAtividade"
                          className="w-full p-2 sm:p-3 border rounded-md bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                          value={filtrosLog.tipoAtividade}
                          onChange={(e) => setFiltrosLog({ ...filtrosLog, tipoAtividade: e.target.value })}
                        >
                          <option value="">Todos</option>
                          <option value="LOGIN_SUCESSO">Login Sucesso</option>
                          <option value="TENTATIVA_LOGIN_INCORRETA">Tentativa Login Incorreta</option>
                          <option value="BLOQUEIO_AUTOMATICO">Bloqueio Automático</option>
                          <option value="DESBLOQUEIO_MANUAL">Desbloqueio Manual</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="dataInicio" className="text-sm font-medium text-white">
                          Data Início
                        </Label>
                        <Input
                          type="date"
                          id="dataInicio"
                          value={filtrosLog.dataInicio}
                          onChange={(e) => setFiltrosLog({ ...filtrosLog, dataInicio: e.target.value })}
                          className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataFim" className="text-sm font-medium text-white">
                          Data Fim
                        </Label>
                        <Input
                          type="date"
                          id="dataFim"
                          value={filtrosLog.dataFim}
                          onChange={(e) => setFiltrosLog({ ...filtrosLog, dataFim: e.target.value })}
                          className="text-sm sm:text-base bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <Button onClick={buscarLogs} className="w-full sm:w-auto">
                      Buscar
                    </Button>
                  </div>

                  {logsAtividades.length === 0 ? (
                    <p className="text-blue-100/60 text-center py-8 text-sm sm:text-base">
                      Nenhuma atividade registrada
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {logsAtividades.map((log) => (
                        <div
                          key={log.id}
                          className="flex flex-col p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl gap-3 sm:gap-4 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                              {getAcaoIcon(log.tipo)}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm sm:text-base truncate text-white">
                                  {log.tipo.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs sm:text-sm text-blue-100/70">{formatarDataHora(log.data_hora)}</p>
                                <div className="sm:hidden mt-1 space-y-1">
                                  <p className="text-xs text-blue-100/60">{log.descricao}</p>
                                  {log.usuario_nome && (
                                    <p className="text-xs text-blue-100/60">Usuário: {log.usuario_nome}</p>
                                  )}
                                  {log.colaborador_nome && (
                                    <p className="text-xs text-blue-100/60">Colaborador: {log.colaborador_nome}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-xs ${getAcaoCor(log.tipo)}`}>
                                {log.sucesso ? "Sucesso" : "Falha"}
                              </Badge>
                            </div>
                          </div>

                          <div className="sm:flex sm:justify-between sm:items-center pt-2 border-t border-white/10">
                            <p className="text-xs text-blue-100/60 sm:hidden">{log.descricao}</p>
                            <div className="flex items-center gap-2">
                              {log.usuario_nome && (
                                <p className="text-xs text-blue-100/60">Usuário: {log.usuario_nome}</p>
                              )}
                              {log.colaborador_nome && (
                                <p className="text-xs text-blue-100/60">Colaborador: {log.colaborador_nome}</p>
                              )}
                              {log.ip_address && <p className="text-xs text-blue-100/60">IP: {log.ip_address}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={() => carregarLogsAtividades(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-white">
                      Página {paginaAtual} de {Math.ceil(totalLogs / 10)}
                    </span>
                    <Button
                      onClick={() => carregarLogsAtividades(paginaAtual + 1)}
                      disabled={paginaAtual >= Math.ceil(totalLogs / 10)}
                      variant="outline"
                    >
                      Próxima
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
