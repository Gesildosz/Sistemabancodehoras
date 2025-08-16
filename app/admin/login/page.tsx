"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, User, Lock, Phone, CreditCard, Briefcase, Home } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(1) // 1: crachá, 2: login/senha, 3: validação dados, 4: mostrar credenciais, 5: nova senha
  const [cracha, setCracha] = useState("")
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [adminInfo, setAdminInfo] = useState<{ id: number; nome: string } | null>(null)

  const [cpf, setCpf] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cargo, setCargo] = useState("")

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  const [credenciaisAtuais, setCredenciaisAtuais] = useState<{ usuario: string; senha: string } | null>(null)

  const verificarCracha = async () => {
    if (!cracha.trim()) {
      setErro("Digite o número do crachá")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const response = await fetch("/api/admin/auth/verifica-cracha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cracha: cracha.trim() }),
      })

      const data = await response.json()

      if (data.ok) {
        setAdminInfo({ id: data.adminId, nome: data.nome })
        setEtapa(2)
      } else {
        setErro(data.error || "Crachá não encontrado")
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const fazerLogin = async () => {
    if (!usuario.trim() || !senha.trim()) {
      setErro("Digite usuário e senha")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          senha: senha.trim(),
          adminId: adminInfo?.id,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        // Store admin session
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            id: data.admin.id,
            nome: data.admin.nome_completo,
            usuario: data.admin.usuario,
            permissoes: data.admin.permissoes,
            loginTime: Date.now(),
          }),
        )

        router.push("/admin")
      } else {
        setErro(data.error || "Credenciais inválidas")
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const esqueceuSenha = () => {
    setEtapa(3)
    setErro("")
    setSucesso("")
    setCpf("")
    setTelefone("")
    setCargo("")
  }

  const validarDados = async () => {
    if (!cpf.trim() || !telefone.trim() || !cargo.trim()) {
      setErro("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const response = await fetch("/api/admin/auth/validar-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cracha: cracha.trim(),
          cpf: cpf.trim(),
          telefone: telefone.trim(),
          cargo: cargo.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        const credenciaisResponse = await fetch("/api/admin/auth/get-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId: adminInfo?.id }),
        })

        const credenciaisData = await credenciaisResponse.json()

        if (credenciaisData.success) {
          setCredenciaisAtuais(credenciaisData.credentials)
          setSucesso("Dados validados com sucesso!")
          setTimeout(() => {
            setEtapa(4) // Ir para etapa de mostrar credenciais
            setSucesso("")
          }, 1500)
        } else {
          setErro("Erro ao buscar credenciais")
        }
      } else {
        setErro(data.error || "Os dados informados não conferem com o cadastro")
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const redefinirSenha = async () => {
    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      setErro("Digite a nova senha e confirmação")
      return
    }

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem")
      return
    }

    const temNumero = /\d/.test(novaSenha)
    const temLetra = /[a-zA-Z]/.test(novaSenha)

    if (!temNumero || !temLetra) {
      setErro("A senha deve conter pelo menos uma letra e um número")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminInfo?.id,
          novaSenha: novaSenha.trim(),
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setSucesso("Senha redefinida com sucesso!")
        setTimeout(() => {
          setEtapa(2)
          setSucesso("")
          setNovaSenha("")
          setConfirmarSenha("")
          setCpf("")
          setTelefone("")
          setCargo("")
          setCredenciaisAtuais(null) // Limpar credenciais
        }, 2000)
      } else {
        setErro(data.error || "Erro ao redefinir senha")
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const calcularForcaSenha = (senha: string) => {
    let forca = 0
    if (senha.length >= 6) forca += 1
    if (/[a-z]/.test(senha)) forca += 1
    if (/[A-Z]/.test(senha)) forca += 1
    if (/\d/.test(senha)) forca += 1
    if (/[^a-zA-Z\d]/.test(senha)) forca += 1
    return forca
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (etapa === 1) {
        verificarCracha()
      } else if (etapa === 2) {
        fazerLogin()
      } else if (etapa === 3) {
        validarDados()
      } else if (etapa === 5) {
        // Atualizar para etapa 5
        redefinirSenha()
      }
    }
  }

  const obterTitulo = () => {
    switch (etapa) {
      case 1:
        return "Acesso Administrativo"
      case 2:
        return "Login do Administrador"
      case 3:
        return "Validação de Segurança"
      case 4: // Nova etapa para mostrar credenciais
        return "Suas Credenciais"
      case 5: // Mover redefinição para etapa 5
        return "Redefinir Senha"
      default:
        return "Acesso Administrativo"
    }
  }

  const obterDescricao = () => {
    switch (etapa) {
      case 1:
        return "Digite seu número de crachá para continuar"
      case 2:
        return `Bem-vindo, ${adminInfo?.nome}`
      case 3:
        return "Confirme seus dados cadastrais para continuar"
      case 4: // Nova descrição para mostrar credenciais
        return "Aqui estão suas credenciais atuais"
      case 5: // Mover descrição para etapa 5
        return "Digite sua nova senha"
      default:
        return "Digite seu número de crachá para continuar"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <Button
        onClick={() => router.push("/")}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 z-20"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Painel do Colaborador</span>
        <span className="sm:hidden">Início</span>
      </Button>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">{obterTitulo()}</CardTitle>
            <CardDescription className="text-white/70">{obterDescricao()}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {erro && (
            <Alert className="bg-red-500/20 border-red-500/50 text-red-100">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {sucesso && (
            <Alert className="bg-green-500/20 border-green-500/50 text-green-100">
              <AlertDescription>{sucesso}</AlertDescription>
            </Alert>
          )}

          {etapa === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Número do Crachá</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    value={cracha}
                    onChange={(e) => setCracha(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite seu crachá"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                onClick={verificarCracha}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 transition-all duration-200"
              >
                {loading ? "Verificando..." : "Continuar"}
              </Button>
            </div>
          ) : etapa === 2 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite seu usuário"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={esqueceuSenha}
                  className="text-sm text-amber-400 hover:text-amber-300 underline transition-colors"
                  disabled={loading}
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEtapa(1)
                    setUsuario("")
                    setSenha("")
                    setErro("")
                    setAdminInfo(null)
                  }}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  onClick={fazerLogin}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </div>
          ) : etapa === 3 ? (
            <div className="space-y-4">
              <div className="text-sm text-white/70 bg-white/5 p-3 rounded-lg">
                Para sua segurança, confirme os dados do seu cadastro:
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">CPF</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCpf(e.target.value))}
                    onKeyPress={handleKeyPress}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    onKeyPress={handleKeyPress}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite seu cargo"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEtapa(2)
                    setCpf("")
                    setTelefone("")
                    setCargo("")
                    setErro("")
                    setSucesso("")
                  }}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Voltar
                </Button>
                <Button
                  onClick={validarDados}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
                >
                  {loading ? "Validando..." : "Validar"}
                </Button>
              </div>
            </div>
          ) : etapa === 4 ? ( // Nova etapa para mostrar credenciais
            <div className="space-y-4">
              <div className="text-center bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="text-lg font-semibold text-white mb-4">Suas Credenciais Atuais</div>

                <div className="space-y-3">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="text-sm text-white/70 mb-1">Usuário:</div>
                    <div className="text-white font-mono text-lg">{credenciaisAtuais?.usuario}</div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="text-sm text-white/70 mb-1">Senha:</div>
                    <div className="text-white font-mono text-lg">{credenciaisAtuais?.senha}</div>
                  </div>
                </div>

                <div className="text-xs text-amber-300 mt-4 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  ⚠️ Anote essas informações em local seguro
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEtapa(2)
                    setCredenciaisAtuais(null)
                    setCpf("")
                    setTelefone("")
                    setCargo("")
                    setErro("")
                    setSucesso("")
                  }}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Fazer Login
                </Button>
                <Button
                  onClick={() => setEtapa(5)} // Ir para etapa 5
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite a nova senha"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {novaSenha && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            calcularForcaSenha(novaSenha) >= level
                              ? level <= 2
                                ? "bg-red-500"
                                : level <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-white/60">
                      Força:{" "}
                      {calcularForcaSenha(novaSenha) <= 2
                        ? "Fraca"
                        : calcularForcaSenha(novaSenha) <= 3
                          ? "Média"
                          : "Forte"}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Confirme a nova senha"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber-400 focus:ring-amber-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-white/60 bg-white/5 p-3 rounded-lg space-y-1">
                <div>• Mínimo 6 caracteres</div>
                <div>• Pelo menos uma letra e um número</div>
                <div>• Caracteres especiais aumentam a segurança</div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEtapa(4) // Voltar para etapa 4
                    setNovaSenha("")
                    setConfirmarSenha("")
                    setErro("")
                    setSucesso("")
                  }}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  onClick={redefinirSenha}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
                >
                  {loading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
