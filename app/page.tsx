"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  CalendarPlus,
  CalendarClock,
  CalendarX,
  CalendarDays,
  Clock,
  User,
  ArrowLeft,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  FileText,
  FileX,
  Shield,
  Bell,
  LogOut,
  X,
  History,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Home() {
  const [etapa, setEtapa] = useState(1)
  const [cracha, setCracha] = useState("")
  const [colaborador, setColaborador] = useState<any>(null)
  const [codigoAcesso, setCodigoAcesso] = useState("")
  const [novoCodigoFixo, setNovoCodigoFixo] = useState("")
  const [confirmarCodigoFixo, setConfirmarCodigoFixo] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tentativasErradas, setTentativasErradas] = useState(0)
  const [novoCodigoGerado, setNovoCodigoGerado] = useState("")
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false)
  const [mostrarReset, setMostrarReset] = useState(false)

  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false)
  const [pinDesbloqueio, setPinDesbloqueio] = useState("")
  const [mostrarPin, setMostrarPin] = useState(false)
  const [dadosRecuperacao, setDadosRecuperacao] = useState({
    nomeCompleto: "",
    cargo: "",
    empresa: "",
    nomeSupervisor: "",
  })
  const [codigoRecuperado, setCodigoRecuperado] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para banco de horas
  const [saldo, setSaldo] = useState(0)
  const [historico, setHistorico] = useState([])
  const [loadingDados, setLoadingDados] = useState(false)

  // Estados para agendamento de folga
  const [dataFolga, setDataFolga] = useState("")
  const [motivoFolga, setMotivoFolga] = useState("")
  const [solicitacoesFolga, setSolicitacoesFolga] = useState([])
  const [loadingFolga, setLoadingFolga] = useState(false)
  const [folgaDuplicada, setFolgaDuplicada] = useState(null)
  const [mostrarReagendamento, setMostrarReagendamento] = useState(false)
  const [modoAgendamento, setModoAgendamento] = useState("agendar") // "agendar", "reagendar" ou "cancelar"
  const [folgaSelecionada, setFolgaSelecionada] = useState(null)

  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [outroMotivoCancelamento, setOutroMotivoCancelamento] = useState("")

  const [dualAccess, setDualAccess] = useState(false)
  const [accessOptions, setAccessOptions] = useState<{ colaborador?: any; administrador?: any }>({})

  const [showPopup, setShowPopup] = useState(false)
  const [popupData, setPopupData] = useState(null)

  const [mostrarAlertaBloqueio, setMostrarAlertaBloqueio] = useState(null)
  const [showBlockedMessage, setShowBlockedMessage] = useState(false)
  const [tokenDesbloqueio, setTokenDesbloqueio] = useState("")

  const [adminData, setAdminData] = useState<any>(null)
  const [colaboradorData, setColaboradorData] = useState<any>(null)

  const AlertaBloqueio = ({ mensagem, token, onFechar }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-red-100">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Acesso Restrito</h3>
              <p className="text-red-100 text-sm">Autorização necessária</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium text-center">{mensagem}</p>
          </div>

          {token && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-600 text-sm text-center mb-2">Apresente este código ao administrador:</p>
              <div className="bg-white border-2 border-slate-300 rounded-lg p-3 text-center">
                <span className="text-2xl font-mono font-bold text-slate-800 tracking-wider">{token}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como proceder:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Procure um administrador do sistema</li>
                  <li>• Informe o código acima (se disponível)</li>
                  <li>• Aguarde a liberação do acesso</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={onFechar}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl py-3 font-semibold transition-all duration-200"
          >
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )

  const verificarUltimaAtualizacao = async (colaboradorId: number) => {
    try {
      const response = await fetch(`/api/colaborador/${colaboradorId}/ultima-atualizacao`)
      const data = await response.json()

      if (data.hasUpdate && data.ultimaAtualizacao) {
        setPopupData(data.ultimaAtualizacao)
        setShowPopup(true)
      }
    } catch (error) {
      console.error("Erro ao verificar última atualização:", error)
    }
  }

  const verificarCracha = async () => {
    if (!cracha.trim()) {
      setError("Por favor, digite seu crachá")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Verificando crachá:", cracha)
      const response = await fetch("/api/colaborador/verifica-cracha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cracha }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Crachá verificado com sucesso:", data)

        if (data.dualAccess) {
          console.log("[v0] Dual access detectado, indo para tela de escolha")
          setDualAccess(true)
          setAccessOptions({
            colaborador: data.colaborador,
            administrador: data.administrador,
          })
          setEtapa(1.5) // Ir para tela de escolha
          return
        }

        // Para acesso simples (apenas colaborador ou apenas administrador)
        let colaboradorData = null

        if (data.tipo === "colaborador") {
          // Formato para acesso simples: { tipo: "colaborador", colaboradorId: ..., nome: ..., etc }
          colaboradorData = {
            id: data.colaboradorId,
            nome: data.nome,
            cracha: data.cracha,
            primeiroAcesso: data.primeiroAcesso || false,
          }
        } else if (data.tipo === "administrador") {
          console.log("[v0] Administrador detectado, redirecionando para painel admin")
          setAdminData({
            id: data.adminId,
            nome: data.nome,
            cracha: data.cracha,
          })
          window.location.href = "/admin/login"
          return
        }

        console.log("[v0] Dados do colaborador processados:", colaboradorData)
        setColaborador(colaboradorData)

        if (colaboradorData?.id) {
          console.log("[v0] Colaborador logado, carregando dados automaticamente:", colaboradorData.id)
          setTimeout(() => {
            carregarDadosColaborador()
          }, 100)
        }

        if (data.primeiroAcesso) {
          console.log("[v0] Primeiro acesso detectado, indo para etapa 2 (código temporário)")
          setPrimeiroAcesso(true)
          setEtapa(2)
        } else {
          console.log("[v0] Acesso normal, indo para etapa 4 (código fixo)")
          setEtapa(4)
        }
        console.log("[v0] Etapa definida, estado atual:", {
          primeiroAcesso: data.primeiroAcesso,
          etapa: data.primeiroAcesso ? 2 : 4,
        })
      } else {
        if (data.blocked) {
          console.log("[v0] Usuário bloqueado detectado:", data)
          setColaborador({
            id: data.colaboradorId || data.adminId,
            nome: data.nome,
            cracha: data.cracha,
            tipo: data.tipo,
          })
          setError(data.error)
          setMostrarRecuperacao(true)
          setEtapa(4) // Go to code verification screen to show recovery option
        } else {
          setError(data.error || "Erro ao buscar colaborador")
          setTentativasErradas((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("[v0] Erro ao verificar crachá:", error)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const escolherTipoAcesso = (tipo: "colaborador" | "administrador") => {
    console.log("[v0] Usuário escolheu acesso como:", tipo)

    if (tipo === "administrador") {
      window.location.href = "/admin/login"
    } else {
      const colaboradorData = accessOptions.colaborador
      console.log("[v0] Dados do colaborador para acesso:", colaboradorData)

      setColaborador({
        id: colaboradorData.id,
        nome: colaboradorData.nome,
        cracha: colaboradorData.cracha,
      })
      setPrimeiroAcesso(colaboradorData.primeiroAcesso || false)
      setDualAccess(false) // Reset dual access state

      // Carregar dados do colaborador automaticamente
      setTimeout(() => {
        carregarDadosColaborador()
      }, 100)

      if (colaboradorData.primeiroAcesso) {
        console.log("[v0] Primeiro acesso, indo para código temporário")
        setEtapa(2) // Código temporário
      } else {
        console.log("[v0] Acesso normal, indo para código fixo")
        setEtapa(4) // Código fixo
      }
    }
  }

  const verificarCodigoTemporario = async () => {
    if (!codigoAcesso.trim()) {
      setError("Digite o código temporário")
      return
    }

    setLoading(true)
    setError("")

    try {
      const ultimosDigitosCracha = colaborador.cracha.toString().slice(-4)
      const codigoCompleto = codigoAcesso.trim() + ultimosDigitosCracha

      console.log("[v0] Enviando código completo:", codigoCompleto)

      const response = await fetch("/api/colaborador/verifica-codigo-temporario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          codigoTemporario: codigoCompleto, // Enviando código completo
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setNovoCodigoGerado("")
        setTentativasErradas(0)
        setMostrarReset(false)
        setEtapa(3) // Ir para etapa de cadastro de código fixo

        if (data.precisaCadastrarCodigoFixo) {
          setPrimeiroAcesso(true)
        } else {
          setColaborador({ ...colaborador, logado: true })
        }
      } else {
        const novasTentativas = tentativasErradas + 1
        setTentativasErradas(novasTentativas)
        setError(data.error || "Código temporário inválido")

        if (novasTentativas >= 3) {
          setMostrarReset(true)
        }
      }
    } catch (error) {
      const novasTentativas = tentativasErradas + 1
      setTentativasErradas(novasTentativas)
      setError("Erro ao verificar código temporário")

      if (novasTentativas >= 3) {
        setMostrarReset(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetarCodigoTemporario = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/resetar-codigo-temporario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setNovoCodigoGerado(data.novoCodigoTemporario)
        setCodigoAcesso("")
        setTentativasErradas(0)
        setMostrarReset(false)
        setError("")

        setTimeout(() => {
          setError("Novo código gerado! Use o código destacado acima.")
        }, 100)
      } else {
        setError(data.error || "Erro ao resetar código temporário")
      }
    } catch (error) {
      setError("Erro ao resetar código temporário")
    } finally {
      setLoading(false)
    }
  }

  const cadastrarCodigoFixo = async () => {
    console.log("[v0] Iniciando cadastro de código fixo no frontend...")

    if (!novoCodigoFixo.trim()) {
      console.log("[v0] Erro: Código vazio")
      setError("Digite o novo código de acesso")
      return
    }

    if (novoCodigoFixo.length < 4) {
      console.log("[v0] Erro: Código muito curto")
      setError("O código deve ter pelo menos 4 caracteres")
      return
    }

    if (novoCodigoFixo !== confirmarCodigoFixo) {
      console.log("[v0] Erro: Códigos não coincidem")
      setError("Os códigos não coincidem")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Enviando requisição para cadastrar código...")
      console.log("[v0] Dados:", { colaboradorId: colaborador.id, codigoLength: novoCodigoFixo.length })

      const response = await fetch("/api/colaborador/cadastrar-codigo-fixo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          novoCodigoFixo: novoCodigoFixo.trim(),
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers.get("content-type"))

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (data.ok) {
        console.log("[v0] Código cadastrado com sucesso, redirecionando...")
        setEtapa(5) // Ir para painel
        carregarDadosColaborador(colaborador)
      } else {
        console.log("[v0] Erro retornado pela API:", data.error)
        setError(data.error || "Erro ao cadastrar código")
      }
    } catch (error) {
      console.error("[v0] Erro na requisição:", error)
      setError("Erro ao cadastrar código")
    } finally {
      setLoading(false)
    }
  }

  const verificarInformacoes = async () => {
    if (
      !dadosRecuperacao.nomeCompleto ||
      !dadosRecuperacao.cargo ||
      !dadosRecuperacao.empresa ||
      !dadosRecuperacao.nomeSupervisor
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Iniciando verificação de informações para recuperação...")
      console.log("[v0] Dados enviados:", {
        cracha: colaborador?.cracha,
        nomeCompleto: dadosRecuperacao.nomeCompleto,
        cargo: dadosRecuperacao.cargo,
        empresa: dadosRecuperacao.empresa,
        nomeSupervisor: dadosRecuperacao.nomeSupervisor,
      })

      const response = await fetch("/api/colaborador/verificar-informacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cracha: colaborador?.cracha,
          nomeCompleto: dadosRecuperacao.nomeCompleto,
          cargo: dadosRecuperacao.cargo,
          empresa: dadosRecuperacao.empresa,
          nomeSupervisor: dadosRecuperacao.nomeSupervisor,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (data.ok) {
        console.log("[v0] Solicitação de recuperação criada com sucesso!")
        setMostrarRecuperacao(false)
        setDadosRecuperacao({
          nomeCompleto: "",
          cargo: "",
          empresa: "",
          nomeSupervisor: "",
        })
        setCodigoAcesso("")
        setTentativasErradas(0)
        setError("")
        setSuccess("Solicitação de recuperação enviada com sucesso! Aguarde a aprovação do administrador.")
        console.log("[v0] Success message set:", "Solicitação de recuperação enviada com sucesso!")
      } else {
        console.error("[v0] Erro na resposta da API:", data.error)
        setError(data.error)
      }
    } catch (error) {
      console.error("[v0] Erro ao enviar solicitação:", error)
      setError("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const gerarPinDesbloqueio = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/gerar-pin-desbloqueio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          cracha: colaborador.cracha,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setPinDesbloqueio(data.pin)
        setMostrarPin(true)
        setMostrarRecuperacao(false)
        setError("")
      } else {
        setError(data.error || "Erro ao gerar PIN de desbloqueio")
      }
    } catch (error) {
      setError("Erro ao gerar PIN de desbloqueio")
    } finally {
      setLoading(false)
    }
  }

  const verificarCodigoAcesso = async () => {
    if (!codigoAcesso.trim()) {
      setError("Por favor, digite seu código de acesso")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Enviando código fixo:", codigoAcesso)

      const requestData = {
        codigoAcesso: codigoAcesso,
      }

      if (colaborador?.id) {
        requestData.colaboradorId = colaborador.id
      } else if (adminData?.id) {
        requestData.colaboradorId = adminData.id
      } else if (colaboradorData?.id) {
        requestData.colaboradorId = colaboradorData.id
      } else {
        console.error("[v0] Nenhum ID de usuário encontrado")
        setError("Erro interno: dados do usuário não encontrados")
        setLoading(false)
        return
      }

      console.log("[v0] Dados da requisição:", requestData)

      const response = await fetch("/api/colaborador/verifica-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()
      console.log("[v0] Resposta da API:", data)

      if (response.ok) {
        console.log("[v0] Login bem-sucedido")
        setEtapa(5)
        setError("")
        setTentativasErradas(0)
      } else {
        if (
          response.status === 403 &&
          (data.error?.includes("bloqueado") || data.error?.includes("Acesso bloqueado"))
        ) {
          console.log("[v0] Usuário bloqueado, token:", data.token || data.tokenDesbloqueio)
          setShowBlockedMessage(true)
          if (data.tokenDesbloqueio || data.token) {
            setTokenDesbloqueio(data.tokenDesbloqueio || data.token)
          }
        } else {
          setError(data.error || "Código incorreto")
          // Extrair número da tentativa da mensagem de erro
          const tentativaMatch = data.error.match(/Tentativa (\d+)\/3/)
          if (tentativaMatch) {
            const tentativaAtual = Number.parseInt(tentativaMatch[1])
            setTentativasErradas(tentativaAtual)
            if (tentativaAtual >= 3) {
              console.log("[v0] 3 tentativas atingidas, gerando PIN automaticamente")
              await gerarPinAutomatico()
            }
          } else {
            const novasTentativas = tentativasErradas + 1
            setTentativasErradas(novasTentativas)
            if (novasTentativas >= 3) {
              console.log("[v0] 3 tentativas atingidas, gerando PIN automaticamente")
              await gerarPinAutomatico()
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Erro na verificação:", error)
      setError("Erro ao verificar código")
      const novasTentativas = tentativasErradas + 1
      setTentativasErradas(novasTentativas)
      if (novasTentativas >= 3) {
        console.log("[v0] 3 tentativas atingidas, gerando PIN automaticamente")
        await gerarPinAutomatico()
      }
    } finally {
      setLoading(false)
    }
  }

  const gerarPinAutomatico = async () => {
    try {
      console.log("[v0] Gerando PIN automaticamente após 3 tentativas")
      const response = await fetch("/api/colaborador/gerar-pin-desbloqueio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador?.id || adminData?.id || colaboradorData?.id,
          cracha: colaborador?.cracha || adminData?.cracha || colaboradorData?.cracha,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        console.log("[v0] PIN gerado automaticamente:", data.pin)
        setPinDesbloqueio(data.pin)
        setMostrarPin(true)
        setError("")
      } else {
        console.error("[v0] Erro ao gerar PIN:", data.error)
        setError(data.error || "Erro ao gerar PIN de desbloqueio")
      }
    } catch (error) {
      console.error("[v0] Erro ao gerar PIN automaticamente:", error)
      setError("Erro ao gerar PIN de desbloqueio")
    }
  }

  const reagendarFolga = async () => {
    if (!folgaSelecionada) {
      setError("Selecione uma folga para reagendar")
      return
    }

    if (!dataFolga) {
      setError("Selecione a nova data da folga")
      return
    }

    const hoje = new Date()
    const dataSelecionada = new Date(dataFolga)

    if (dataSelecionada <= hoje) {
      setError("Selecione uma data futura")
      return
    }

    setLoadingFolga(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/reagendar-folga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitacaoId: folgaSelecionada.id,
          novaDataFolga: dataFolga,
          novoMotivo: motivoFolga,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setFolgaSelecionada(null)
        setDataFolga("")
        setMotivoFolga("")
        setModoAgendamento("agendar")
        carregarDadosColaborador() // Recarregar dados
        alert("Folga reagendada com sucesso!")
      } else {
        setError(data.error || "Erro ao reagendar folga")
      }
    } catch (error) {
      setError("Erro ao reagendar folga")
    } finally {
      setLoadingFolga(false)
    }
  }

  const carregarDadosCompletosColaborador = async (colaboradorId: number) => {
    try {
      const response = await fetch(`/api/colaborador/${colaboradorId}`)
      if (response.ok) {
        const data = await response.json()
        setColaborador((prev) => ({
          ...prev,
          ...data.colaborador,
        }))
      }
    } catch (error) {
      console.error("Erro ao carregar dados completos:", error)
    }
  }

  useEffect(() => {
    if (colaborador?.id && !loadingDados) {
      console.log("[v0] Colaborador logado, carregando dados automaticamente:", colaborador.id)
      carregarDadosColaborador()
    }
  }, [colaborador?.id])

  const carregarDadosColaborador = async () => {
    if (!colaborador?.id) return

    console.log("[v0] Iniciando carregamento de dados para colaborador:", colaborador.id)
    setLoadingDados(true)

    try {
      const [bancoResponse, folgasResponse] = await Promise.all([
        fetch(`/api/colaborador/${colaborador.id}/banco`),
        fetch(`/api/colaborador/${colaborador.id}/folgas`),
      ])

      if (bancoResponse.ok) {
        const bancoData = await bancoResponse.json()
        console.log("[v0] Dados do banco carregados:", bancoData)
        setSaldo(bancoData.saldo || 0)
        setHistorico(Array.isArray(bancoData.historico) ? bancoData.historico : [])
      } else {
        console.error("[v0] Erro ao carregar dados do banco:", bancoResponse.status)
        setSaldo(0)
        setHistorico([])
      }

      if (folgasResponse.ok) {
        const folgasData = await folgasResponse.json()
        console.log("[v0] Dados das folgas carregados:", folgasData)
        setSolicitacoesFolga(Array.isArray(folgasData.solicitacoes) ? folgasData.solicitacoes : [])
      } else {
        console.error("[v0] Erro ao carregar folgas:", folgasResponse.status)
        setSolicitacoesFolga([])
      }

      await verificarUltimaAtualizacao(colaborador.id)

      console.log("[v0] Todos os dados carregados com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao carregar dados:", error)
      setSaldo(0)
      setSolicitacoesFolga([])
      setHistorico([])
    } finally {
      setLoadingDados(false)
    }
  }

  const calcularHorasDebito = (data) => {
    const [ano, mes, dia] = data.split("-").map(Number)
    const date = new Date(ano, mes - 1, dia)
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

    // Sábado = 4 horas, outros dias = 8 horas
    return dayOfWeek === 6 ? 4 : 8
  }

  const verificarFolgaExistente = (data) => {
    if (!Array.isArray(solicitacoesFolga)) return null
    return solicitacoesFolga.find((solicitacao) => solicitacao.data_folga === data && solicitacao.status === "pendente")
  }

  const solicitarFolga = async () => {
    console.log("[v0] Iniciando solicitação de folga...")

    if (!dataFolga) {
      console.log("[v0] Erro: Data da folga não selecionada")
      setError("Selecione a data da folga")
      return
    }

    const hoje = new Date()
    const dataSelecionada = new Date(dataFolga)

    if (dataSelecionada <= hoje) {
      console.log("[v0] Erro: Data selecionada é no passado")
      setError("Selecione uma data futura")
      return
    }

    // Verificar se já existe folga para esta data
    const folgaExistente = verificarFolgaExistente(dataFolga)
    if (folgaExistente) {
      console.log("[v0] Erro: Folga duplicada encontrada", folgaExistente)
      setFolgaDuplicada(folgaExistente)
      setMostrarReagendamento(true)
      setError(`Já existe uma solicitação de folga pendente para ${new Date(dataFolga).toLocaleDateString("pt-BR")}`)
      return
    }

    setLoadingFolga(true)
    setError("")

    try {
      console.log("[v0] Enviando dados para API:", {
        colaboradorId: colaborador.id,
        dataFolga,
        motivo: motivoFolga.trim(),
      })

      const response = await fetch("/api/colaborador/solicitar-folga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          dataFolga,
          motivo: motivoFolga.trim(),
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", response.headers.get("content-type"))

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (data.ok) {
        console.log("[v0] Folga solicitada com sucesso")
        setDataFolga("")
        setMotivoFolga("")
        carregarDadosColaborador(colaborador) // Recarregar dados
        alert("Solicitação de folga enviada com sucesso!")
      } else {
        console.log("[v0] Erro na resposta da API:", data.error)
        setError(data.error || "Erro ao solicitar folga")
      }
    } catch (error) {
      console.log("[v0] Erro na requisição:", error)
      setError("Erro ao solicitar folga")
    } finally {
      setLoadingFolga(false)
    }
  }

  const cancelarReagendamento = () => {
    setFolgaSelecionada(null)
    setMostrarReagendamento(false)
    setError("")
  }

  const logout = () => {
    setEtapa(1)
    setCracha("")
    setCodigoAcesso("")
    setNovoCodigoFixo("")
    setConfirmarCodigoFixo("")
    setColaborador(null)
    setPrimeiroAcesso(false)
    setSaldo(0)
    setHistorico([])
    setSolicitacoesFolga([])
    setError("")
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "aprovada":
        return "bg-green-100 text-green-800"
      case "recusada":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const cancelarFolga = async () => {
    if (!folgaSelecionada) {
      setError("Selecione uma folga para cancelar")
      return
    }

    if (!motivoCancelamento) {
      setError("Selecione o motivo do cancelamento")
      return
    }

    if (motivoCancelamento === "Outros" && !outroMotivoCancelamento.trim()) {
      setError("Descreva o motivo do cancelamento")
      return
    }

    setLoadingFolga(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/cancelar-folga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitacaoId: folgaSelecionada.id,
          motivoCancelamento: motivoCancelamento === "Outros" ? outroMotivoCancelamento.trim() : motivoCancelamento,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setFolgaSelecionada(null)
        setMotivoCancelamento("")
        setOutroMotivoCancelamento("")
        setModoAgendamento("agendar")
        carregarDadosColaborador() // Recarregar dados
        alert("Folga cancelada com sucesso! As horas foram devolvidas ao seu saldo.")
      } else {
        setError(data.error || "Erro ao cancelar folga")
      }
    } catch (error) {
      setError("Erro ao cancelar folga")
    } finally {
      setLoadingFolga(false)
    }
  }

  if (etapa === 1.5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto w-16 sm:w-18 md:w-20 lg:w-24 xl:w-28 h-16 sm:h-18 md:h-20 lg:h-24 xl:h-28 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">
              Escolha o Tipo de Acesso
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">
              Seu crachá tem acesso a ambos os sistemas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            <Button
              onClick={() => escolherTipoAcesso("colaborador")}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-3">
                <User className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Entrar como Colaborador</div>
                  <div className="text-xs text-blue-100">{accessOptions.colaborador?.nome}</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => escolherTipoAcesso("administrador")}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-3">
                <Shield className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Entrar como Administrador</div>
                  <div className="text-xs text-amber-100">{accessOptions.administrador?.nome}</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setEtapa(1)}
              variant="outline"
              className="w-full mt-4 border-2 border-slate-300 hover:border-slate-400"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Etapa 1: Verificação do crachá
  if (etapa === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto w-16 sm:w-18 md:w-20 lg:w-24 xl:w-28 h-16 sm:h-18 md:h-20 lg:h-24 xl:h-28 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">
              Sistema de Banco de Horas
            </CardTitle>
            <CardDescription className="text-slate-600 text-base mt-2">Acesse o sistema com seu crachá</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Número do Crachá
              </label>
              <Input
                type="text"
                placeholder="Digite seu crachá"
                value={cracha}
                onChange={(e) => setCracha(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && verificarCracha()}
                className="text-center text-lg h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-3 rounded-xl">
                {error}
              </div>
            )}
            <Button
              onClick={verificarCracha}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                "Continuar"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Etapa 2: Código temporário (primeiro acesso)
  if (etapa === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto w-16 sm:w-18 md:w-20 lg:w-24 xl:w-28 h-16 sm:h-18 md:h-20 lg:h-24 xl:h-28 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Primeiro Acesso</CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Olá, {colaborador?.nome}! Digite o código fornecido pelo administrador + os 4 últimos dígitos do seu
              crachá ({colaborador?.cracha.toString().slice(-4)})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {codigoRecuperado && (
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl text-center animate-pulse">
                <div className="text-green-800 font-semibold mb-3 text-lg">✅ Novo código temporário gerado:</div>
                <div className="text-3xl font-bold text-green-900 bg-green-100 p-4 rounded-lg border-2 border-green-300 shadow-sm">
                  {codigoRecuperado}
                </div>
                <div className="text-sm text-green-700 mt-3 font-medium">
                  📋 Use este código para criar um novo código de acesso
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codigoRecuperado)
                    setError("Código copiado para a área de transferência!")
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                >
                  Clique para copiar
                </button>
              </div>
            )}

            {novoCodigoGerado && (
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl text-center animate-pulse">
                <div className="text-green-800 font-semibold mb-3 text-lg">✅ Novo código temporário gerado:</div>
                <div className="text-3xl font-bold text-green-900 bg-green-100 p-4 rounded-lg border-2 border-green-300 shadow-sm">
                  {novoCodigoGerado}
                </div>
                <div className="text-sm text-green-700 mt-3 font-medium">
                  📋 Copie este código e use para fazer login
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(novoCodigoGerado)
                    setError("Código copiado para a área de transferência!")
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                >
                  Clique para copiar
                </button>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Código do Administrador
              </label>
              <Input
                type="password"
                placeholder="Digite apenas o código do administrador"
                value={codigoAcesso}
                onChange={(e) => setCodigoAcesso(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && verificarCodigoTemporario()}
                className="text-center text-lg h-12 border-2 border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl transition-all duration-200"
              />
              <div className="text-xs text-slate-500 text-center bg-slate-50 p-3 rounded-lg border">
                <div className="font-medium mb-1">Como formar o código completo:</div>
                <div className="flex items-center justify-center gap-1 text-slate-600">
                  <span className="bg-amber-100 px-2 py-1 rounded">Código do Admin</span>
                  <span>+</span>
                  <span className="bg-blue-100 px-2 py-1 rounded">{colaborador?.cracha.toString().slice(-4)}</span>
                  <span>=</span>
                  <span className="bg-green-100 px-2 py-1 rounded font-medium">Código Final</span>
                </div>
              </div>
            </div>

            {mostrarReset && (
              <div className="text-center">
                <button
                  onClick={resetarCodigoTemporario}
                  disabled={loading}
                  className="text-sm text-amber-600 hover:text-amber-800 underline font-medium transition-colors duration-200"
                >
                  Gerar novo código temporário
                </button>
              </div>
            )}

            {error && (
              <div
                className={`text-sm text-center p-4 rounded-xl ${
                  error.includes("copiado") || error.includes("Novo código gerado")
                    ? "text-green-600 bg-green-50 border border-green-200"
                    : "text-red-600 bg-red-50 border border-red-200"
                }`}
              >
                {error}
                {tentativasErradas > 0 && !error.includes("copiado") && !error.includes("Novo código gerado") && (
                  <div className="text-xs text-red-500 mt-1">Tentativas incorretas: {tentativasErradas}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEtapa(1)}
                className="flex-1 h-12 border-2 border-amber-200 hover:border-amber-300 rounded-xl font-semibold transition-all duration-200"
              >
                Voltar
              </Button>
              <Button
                onClick={verificarCodigoTemporario}
                disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verificando...
                  </div>
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (etapa === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Criar Código de Acesso</CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Crie um código de acesso pessoal para próximos acessos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Novo Código de Acesso</label>
              <Input
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={novoCodigoFixo}
                onChange={(e) => setNovoCodigoFixo(e.target.value)}
                className="text-center text-lg h-12 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Confirmar Código</label>
              <Input
                type="password"
                placeholder="Digite novamente"
                value={confirmarCodigoFixo}
                onChange={(e) => setConfirmarCodigoFixo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && cadastrarCodigoFixo()}
                className="text-center text-lg h-12 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-xl">
                {error}
              </div>
            )}
            <Button
              onClick={cadastrarCodigoFixo}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Cadastrando...
                </div>
              ) : (
                "Cadastrar Código"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Etapa 4: Login com código fixo
  if (etapa === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Olá, {colaborador?.nome}</CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Digite seu código de acesso para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {codigoRecuperado && (
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl text-center animate-pulse">
                <div className="text-green-800 font-semibold mb-3 text-lg">✅ Novo código temporário gerado:</div>
                <div className="text-3xl font-bold text-green-900 bg-green-100 p-4 rounded-lg border-2 border-green-300 shadow-sm">
                  {codigoRecuperado}
                </div>
                <div className="text-sm text-green-700 mt-3 font-medium">
                  📋 Use este código para criar um novo código de acesso
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codigoRecuperado)
                    setError("Código copiado para a área de transferência!")
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                >
                  Clique para copiar
                </button>
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setEtapa(2)
                      setCodigoAcesso("")
                      setError("")
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Criar Novo Código de Acesso
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Código de Acesso
              </label>
              <Input
                type="password"
                placeholder="Digite seu código"
                value={codigoAcesso}
                onChange={(e) => setCodigoAcesso(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && verificarCodigoAcesso()}
                className="text-center text-lg h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                disabled={!!codigoRecuperado}
              />
            </div>

            {mostrarPin && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 p-6 rounded-xl space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V7a2 2 0 012-2m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">PIN de Desbloqueio Gerado</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Seu PIN foi enviado para o administrador. Informe este código para solicitar o desbloqueio:
                  </p>

                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-4">
                    <div className="text-3xl font-mono font-bold text-blue-800 tracking-wider">{pinDesbloqueio}</div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pinDesbloqueio)
                      setError("PIN copiado para a área de transferência!")
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📋 Copiar PIN
                  </button>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Instruções:</strong> Apresente este PIN ao administrador para solicitar o desbloqueio do
                      seu acesso. O PIN é válido por 24 horas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className={`text-sm text-center p-4 rounded-xl ${
                  error.includes("copiado") || error.includes("Novo código gerado")
                    ? "text-green-600 bg-green-50 border border-green-200"
                    : "text-red-600 bg-red-50 border border-red-200"
                }`}
              >
                {error}
                {tentativasErradas > 0 && !error.includes("copiado") && !error.includes("Novo código gerado") && (
                  <div className="text-xs text-red-500 mt-1">Tentativas incorretas: {tentativasErradas}</div>
                )}
              </div>
            )}

            {success && (
              <div className="text-center p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="text-green-600 text-4xl mb-3">✓</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Solicitação Enviada!</h3>
                <p className="text-sm text-green-700 mb-4">{success}</p>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-xs text-green-800">
                    <strong>Próximos passos:</strong>
                    <br />• O administrador analisará suas informações
                    <br />• Você será notificado sobre a decisão
                    <br />• Se aprovado, seu código será resetado automaticamente
                  </p>
                </div>
              </div>
            )}

            {!codigoRecuperado && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="flex-1 h-12 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-semibold transition-all duration-200"
                >
                  Voltar
                </Button>
                <Button
                  onClick={verificarCodigoAcesso}
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verificando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  etapa === 5 && (
    <div className="space-y-6">
      {/* Gráfico de Acompanhamento */}
      <Card className="border-2 border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            Gráfico de Acompanhamento - Banco de Horas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historico.slice(-10).map((item, index) => ({
                  data: new Date(item.data_lancamento).toLocaleDateString("pt-BR"),
                  saldo: historico.slice(0, index + 1).reduce((acc, h) => acc + h.horas, 0),
                  horas: item.horas,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "saldo" ? `${value}h` : `${value > 0 ? "+" : ""}${value}h`,
                    name === "saldo" ? "Saldo Acumulado" : "Horas do Lançamento",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Completo de Solicitações */}
      <Card className="border-2 border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <History className="h-6 w-6" />
            Histórico Completo de Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {Array.isArray(solicitacoesFolga) && solicitacoesFolga.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {solicitacoesFolga.map((solicitacao) => (
                <div
                  key={solicitacao.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    solicitacao.status === "aprovada"
                      ? "border-green-200 bg-green-50"
                      : solicitacao.status === "recusada"
                        ? "border-red-200 bg-red-50"
                        : solicitacao.status === "cancelada"
                          ? "border-gray-200 bg-gray-50"
                          : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")} - {solicitacao.dia_semana}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {solicitacao.horas_debitadas}h • Solicitado em{" "}
                        {new Date(solicitacao.data_solicitacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(solicitacao.status)}`}
                    >
                      {solicitacao.status === "pendente"
                        ? "Pendente"
                        : solicitacao.status === "aprovada"
                          ? "Aprovada"
                          : solicitacao.status === "recusada"
                            ? "Recusada"
                            : "Cancelada"}
                    </span>
                  </div>

                  {solicitacao.motivo && (
                    <p className="text-sm text-slate-700 mb-2">
                      <strong>Motivo:</strong> {solicitacao.motivo}
                    </p>
                  )}

                  {solicitacao.observacoes_admin && (
                    <p className="text-sm text-slate-700 mb-2">
                      <strong>Observações:</strong> {solicitacao.observacoes_admin}
                    </p>
                  )}

                  {solicitacao.data_resposta && (
                    <p className="text-xs text-slate-500">
                      Respondido em {new Date(solicitacao.data_resposta).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Nenhuma solicitação de folga encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão para voltar */}
      <div className="flex justify-center">
        <Button
          onClick={() => setEtapa(3)}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Voltar ao Menu Principal
        </Button>
      </div>
    </div>
  )
  etapa === 3 && (
    <div className="space-y-6">
      {/* Cards de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Clock className="h-5 w-5" />
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                {saldo >= 0 ? "+" : ""}
                {saldo}h
              </div>
              <p className="text-slate-600">{saldo >= 0 ? "Horas disponíveis" : "Horas em débito"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              Folgas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-purple-600">
                {Array.isArray(solicitacoesFolga) ? solicitacoesFolga.filter((s) => s.status === "pendente").length : 0}
              </div>
              <p className="text-slate-600">Aguardando aprovação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => setEtapa(4)}
          className="h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
        >
          <div className="flex flex-col items-center gap-1">
            <CalendarPlus className="h-6 w-6" />
            <span>Solicitar Folga</span>
          </div>
        </Button>

        <Button
          onClick={() => setEtapa(5)}
          className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
        >
          <div className="flex flex-col items-center gap-1">
            <History className="h-6 w-6" />
            <span>Ver Histórico</span>
          </div>
        </Button>

        <Button
          onClick={logout}
          variant="outline"
          className="h-16 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-800 font-semibold rounded-xl transition-all duration-200 bg-transparent"
        >
          <div className="flex flex-col items-center gap-1">
            <LogOut className="h-6 w-6" />
            <span>Sair</span>
          </div>
        </Button>
      </div>
    </div>
  )

  if (etapa === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        {showPopup && popupData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Bell className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold">Atualização de Horas</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopup(false)}
                    className="text-white hover:bg-white/20 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {popupData.horas > 0 ? "+" : ""}
                    {popupData.horas}h
                  </div>
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      popupData.horas > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {popupData.horas > 0 ? "Crédito" : "Débito"} de Horas
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Data</span>
                    <p className="text-slate-900 font-medium">
                      {new Date(popupData.data_lancamento).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {popupData.motivo && (
                    <div>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Motivo</span>
                      <p className="text-slate-900">{popupData.motivo}</p>
                    </div>
                  )}

                  {popupData.mensagem_popup && (
                    <div>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Mensagem</span>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-900">{popupData.mensagem_popup}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Lançado por</span>
                    <p className="text-slate-900">{popupData.criado_por}</p>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPopup(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3 font-semibold transition-all duration-200"
                >
                  Entendi
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">
                Painel do Colaborador
              </h1>
              <p className="text-slate-600 text-lg mt-1">Bem-vindo, {colaborador?.nome}</p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="text-red-600 hover:text-red-700 bg-white/80 border-2 border-red-200 hover:border-red-300 rounded-xl px-6 py-2 font-semibold transition-all duration-200 hover:shadow-lg"
            >
              Sair
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Pessoais */}
            {colaborador && (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Nome</span>
                      <p className="text-slate-900 font-medium">{colaborador.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Crachá</span>
                      <p className="text-slate-900 font-medium">{colaborador.cracha}</p>
                    </div>
                    {colaborador.cargo && (
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Cargo</span>
                        <p className="text-slate-900 font-medium">{colaborador.cargo}</p>
                      </div>
                    )}
                    {colaborador.turno && (
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Turno</span>
                        <p className="text-slate-900 font-medium">{colaborador.turno}</p>
                      </div>
                    )}
                    {colaborador.supervisor && (
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Supervisor</span>
                        <p className="text-slate-900 font-medium">{colaborador.supervisor}</p>
                      </div>
                    )}
                    {colaborador.telefone && (
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Telefone</span>
                        <p className="text-slate-900 font-medium">{colaborador.telefone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saldo de Horas */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  Saldo de Horas
                  {loadingDados && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-4">
                  <div className="text-5xl font-bold mb-4">
                    <Badge
                      variant={saldo >= 0 ? "default" : "destructive"}
                      className={`text-3xl px-6 py-3 rounded-2xl shadow-lg ${
                        saldo >= 0
                          ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                          : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                      } ${loadingDados ? "opacity-70" : ""}`}
                    >
                      {loadingDados ? "..." : saldo >= 0 ? `+${saldo}` : saldo}h
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-lg font-medium">
                    {saldo >= 0 ? "Horas a receber" : "Horas em débito"}
                    {loadingDados && <span className="text-sm text-slate-400 ml-2">(atualizando...)</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agendamento de Folga */}
          <Card className="shadow-xl border-0 bg-card backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                Gerenciar Folgas
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-base">
                Agende, reagende ou cancele suas folgas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-1 p-1 bg-muted rounded-xl">
                <Button
                  variant={modoAgendamento === "agendar" ? "default" : "ghost"}
                  onClick={() => {
                    setModoAgendamento("agendar")
                    setFolgaSelecionada(null)
                    setDataFolga("")
                    setMotivoFolga("")
                    setMotivoCancelamento("")
                    setOutroMotivoCancelamento("")
                    setError("")
                  }}
                  className={`flex-1 h-12 rounded-lg font-semibold transition-all duration-200 ${
                    modoAgendamento === "agendar"
                      ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
                <Button
                  variant={modoAgendamento === "reagendar" ? "default" : "ghost"}
                  onClick={() => {
                    setModoAgendamento("reagendar")
                    setDataFolga("")
                    setMotivoFolga("")
                    setMotivoCancelamento("")
                    setOutroMotivoCancelamento("")
                    setError("")
                  }}
                  disabled={
                    !Array.isArray(solicitacoesFolga) ||
                    solicitacoesFolga.filter((s) => s.status === "pendente").length === 0
                  }
                  className={`flex-1 h-12 rounded-lg font-semibold transition-all duration-200 ${
                    modoAgendamento === "reagendar"
                      ? "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Reagendar
                </Button>
                <Button
                  variant={modoAgendamento === "cancelar" ? "default" : "ghost"}
                  onClick={() => {
                    setModoAgendamento("cancelar")
                    setDataFolga("")
                    setMotivoFolga("")
                    setMotivoCancelamento("")
                    setOutroMotivoCancelamento("")
                    setError("")
                  }}
                  disabled={
                    !Array.isArray(solicitacoesFolga) ||
                    solicitacoesFolga.filter((s) => s.status === "pendente").length === 0
                  }
                  className={`flex-1 h-12 rounded-lg font-semibold transition-all duration-200 ${
                    modoAgendamento === "cancelar"
                      ? "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  <CalendarX className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>

              {(modoAgendamento === "reagendar" || modoAgendamento === "cancelar") && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1 h-6 rounded-full ${
                        modoAgendamento === "reagendar" ? "bg-secondary" : "bg-destructive"
                      }`}
                    ></div>
                    <label className="text-sm font-semibold text-foreground">
                      Selecione a folga para {modoAgendamento === "reagendar" ? "reagendar" : "cancelar"}
                    </label>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {Array.isArray(solicitacoesFolga) &&
                      solicitacoesFolga
                        .filter((s) => s.status === "pendente")
                        .map((solicitacao) => (
                          <div
                            key={solicitacao.id}
                            onClick={() => {
                              setFolgaSelecionada(solicitacao)
                              if (modoAgendamento === "reagendar") {
                                setMotivoFolga(solicitacao.motivo || "")
                              }
                            }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              folgaSelecionada?.id === solicitacao.id
                                ? modoAgendamento === "reagendar"
                                  ? "border-secondary bg-secondary/10 shadow-lg"
                                  : "border-destructive bg-destructive/10 shadow-lg"
                                : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground text-lg">
                                  {new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {solicitacao.horas_debitadas}h • {solicitacao.dia_semana}
                                </p>
                              </div>
                              <Badge className="bg-accent/20 text-accent-foreground border-accent/30 font-semibold px-3 py-1 rounded-lg">
                                {solicitacao.status}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                <span>Solicitada</span>
                                <span>Em Análise</span>
                                <span>Finalizada</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Step 1: Solicitada */}
                                <div className="flex items-center">
                                  <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                                  </div>
                                </div>

                                {/* Progress line 1-2 */}
                                <div
                                  className={`flex-1 h-1.5 rounded-full ${
                                    solicitacao.status === "pendente" ? "bg-accent" : "bg-muted"
                                  }`}
                                ></div>

                                {/* Step 2: Em Análise */}
                                <div className="flex items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                      solicitacao.status === "pendente" ? "bg-accent" : "bg-muted"
                                    }`}
                                  >
                                    {solicitacao.status === "pendente" && (
                                      <div className="w-1.5 h-1.5 bg-accent-foreground rounded-full animate-pulse"></div>
                                    )}
                                  </div>
                                </div>

                                {/* Progress line 2-3 */}
                                <div
                                  className={`flex-1 h-1.5 rounded-full ${
                                    solicitacao.status === "aprovada"
                                      ? "bg-primary"
                                      : solicitacao.status === "recusada"
                                        ? "bg-destructive"
                                        : "bg-muted"
                                  }`}
                                ></div>

                                {/* Step 3: Finalizada */}
                                <div className="flex items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                      solicitacao.status === "aprovada"
                                        ? "bg-primary"
                                        : solicitacao.status === "recusada"
                                          ? "bg-destructive"
                                          : "bg-muted"
                                    }`}
                                  >
                                    {(solicitacao.status === "aprovada" || solicitacao.status === "recusada") && (
                                      <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status text */}
                              <div className="text-center">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {solicitacao.status === "pendente" && "Aguardando aprovação do administrador"}
                                  {solicitacao.status === "aprovada" && "Folga aprovada"}
                                  {solicitacao.status === "recusada" && "Folga recusada"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              )}

              {modoAgendamento === "cancelar" && folgaSelecionada && (
                <div className="space-y-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-destructive text-lg">Motivo do Cancelamento</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Outros Compromissos",
                      "Data incorreta",
                      "Marcação errada",
                      "A pedido da liderança",
                      "Outros",
                    ].map((motivo) => (
                      <label key={motivo} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="motivoCancelamento"
                          value={motivo}
                          checked={motivoCancelamento === motivo}
                          onChange={(e) => setMotivoCancelamento(e.target.value)}
                          className="w-4 h-4 text-destructive border-destructive/30 focus:ring-destructive/20 focus:ring-2"
                        />
                        <span className="text-foreground font-medium group-hover:text-destructive transition-colors">
                          {motivo}
                        </span>
                      </label>
                    ))}
                  </div>

                  {motivoCancelamento === "Outros" && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Descreva o motivo
                      </label>
                      <Textarea
                        placeholder="Descreva o motivo do cancelamento"
                        value={outroMotivoCancelamento}
                        onChange={(e) => setOutroMotivoCancelamento(e.target.value)}
                        rows={3}
                        className="border-2 border-destructive/20 focus:border-destructive focus:ring-destructive/20 rounded-xl transition-all duration-200 resize-none bg-background"
                      />
                    </div>
                  )}
                </div>
              )}

              {modoAgendamento !== "cancelar" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {modoAgendamento === "agendar" ? "Data da Folga" : "Nova Data da Folga"}
                    </label>
                    <Input
                      type="date"
                      value={dataFolga}
                      onChange={(e) => setDataFolga(e.target.value)}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="h-12 border-2 border-border focus:border-primary focus:ring-primary/20 rounded-xl transition-all duration-200 bg-background"
                    />
                    {dataFolga && (
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-primary font-semibold">
                            Horas a debitar: {calcularHorasDebito(dataFolga)}h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Motivo (opcional)
                    </label>
                    <Textarea
                      placeholder="Descreva o motivo da folga"
                      value={motivoFolga}
                      onChange={(e) => setMotivoFolga(e.target.value)}
                      rows={4}
                      className="border-2 border-border focus:border-primary focus:ring-primary/20 rounded-xl transition-all duration-200 resize-none bg-background"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-2 justify-center">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {modoAgendamento === "cancelar" && folgaSelecionada ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFolgaSelecionada(null)
                        setMotivoCancelamento("")
                        setOutroMotivoCancelamento("")
                        setModoAgendamento("agendar")
                        setError("")
                      }}
                      className="flex-1 h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl font-semibold transition-all duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      onClick={cancelarFolga}
                      disabled={loadingFolga}
                      className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      {loadingFolga ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin"></div>
                          Cancelando...
                        </div>
                      ) : (
                        <>
                          <CalendarX className="h-4 w-4 mr-2" />
                          Cancelar Folga
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDataFolga("")
                        setMotivoFolga("")
                        setError("")
                      }}
                      className="flex-1 h-12 border-2 border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl font-semibold transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button
                      onClick={modoAgendamento === "agendar" ? solicitarFolga : reagendarFolga}
                      disabled={loadingFolga || !dataFolga}
                      className={`flex-1 h-12 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] ${
                        modoAgendamento === "agendar"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      }`}
                    >
                      {loadingFolga ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                          {modoAgendamento === "agendar" ? "Solicitando..." : "Reagendando..."}
                        </div>
                      ) : modoAgendamento === "agendar" ? (
                        <>
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Solicitar Folga
                        </>
                      ) : (
                        <>
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Reagendar Folga
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-card backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
                </div>
                Histórico de Movimentação
              </CardTitle>
              <CardDescription className="text-white/80 text-base">
                Acompanhe a evolução das suas horas nos últimos 3 meses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingDados ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : (
                <>
                  {/* Gráfico de Barras */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-violet-600" />
                      Evolução Mensal das Horas
                    </h3>
                    <div className="bg-muted/50 rounded-xl p-6">
                      <div className="h-64 flex items-end justify-between gap-4">
                        {(() => {
                          const now = new Date()
                          const months = []

                          // Gerar dados dos últimos 3 meses
                          for (let i = 2; i >= 0; i--) {
                            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
                            const monthName = monthDate.toLocaleDateString("pt-BR", { month: "short" })

                            // Calcular horas do mês baseado no histórico
                            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
                            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

                            const horasDoMes = Array.isArray(historico)
                              ? historico
                                  .filter((h) => {
                                    const dataLancamento = new Date(h.data_lancamento)
                                    return dataLancamento >= monthStart && dataLancamento <= monthEnd
                                  })
                                  .reduce((total, h) => total + h.horas, 0)
                              : 0

                            months.push({ month: monthName, horas: horasDoMes })
                          }

                          const maxHoras = Math.max(...months.map((m) => Math.abs(m.horas)), 1)

                          return months.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full flex flex-col items-center justify-end h-48">
                                <div className="text-xs font-semibold text-foreground mb-1">
                                  {data.horas > 0 ? `+${data.horas}h` : `${data.horas}h`}
                                </div>
                                <div
                                  className={`w-12 rounded-t-lg transition-all duration-500 ${
                                    data.horas >= 0
                                      ? "bg-gradient-to-t from-emerald-500 to-green-400"
                                      : "bg-gradient-to-t from-red-500 to-rose-400"
                                  }`}
                                  style={{
                                    height: `${Math.max((Math.abs(data.horas) / maxHoras) * 180, 8)}px`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground capitalize">{data.month}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Movimentações */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-violet-600" />
                      Extrato de Movimentações
                    </h3>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-muted/50 px-6 py-4 border-b border-border">
                        <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-muted-foreground">
                          <span>Data</span>
                          <span>Horas</span>
                          <span>Motivo</span>
                          <span>Responsável</span>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {Array.isArray(historico) && historico.length > 0 ? (
                          historico
                            .sort(
                              (a, b) => new Date(b.data_lancamento).getTime() - new Date(a.data_lancamento).getTime(),
                            )
                            .slice(0, 20)
                            .map((movimento, index) => (
                              <div
                                key={movimento.id}
                                className={`px-6 py-4 border-b border-border/50 hover:bg-muted/30 transition-colors ${
                                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                }`}
                              >
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <span className="text-foreground font-medium">
                                    {new Date(movimento.data_lancamento).toLocaleDateString("pt-BR")}
                                  </span>
                                  <span
                                    className={`font-semibold ${
                                      movimento.horas >= 0 ? "text-emerald-600" : "text-red-600"
                                    }`}
                                  >
                                    {movimento.horas >= 0 ? `+${movimento.horas}h` : `${movimento.horas}h`}
                                  </span>
                                  <span className="text-muted-foreground">{movimento.motivo || "Não informado"}</span>
                                  <span className="text-muted-foreground">{movimento.criado_por || "Sistema"}</span>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="px-6 py-8 text-center text-muted-foreground">
                            <FileX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma movimentação encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {Array.isArray(historico) && historico.length > 20 && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Mostrando as 20 movimentações mais recentes de {historico.length} total
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
