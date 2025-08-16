# Configuração de Variáveis de Ambiente

## Como configurar o arquivo .env.local

1. **Copie o arquivo de exemplo:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Configure as variáveis necessárias:**

### DATABASE_URL (Obrigatório)
- Para desenvolvimento local com PostgreSQL:
  \`\`\`
  DATABASE_URL="postgresql://usuario:senha@localhost:5432/banco_horas"
  \`\`\`
- Para Neon (produção):
  \`\`\`
  DATABASE_URL="postgresql://usuario:senha@ep-xxx.us-east-1.aws.neon.tech/banco_horas"
  \`\`\`

### NEXTAUTH_SECRET (Recomendado)
- Gere uma chave secreta:
  \`\`\`bash
  openssl rand -base64 32
  \`\`\`
- Adicione ao .env.local:
  \`\`\`
  NEXTAUTH_SECRET="sua-chave-secreta-aqui"
  \`\`\`

### NEXTAUTH_URL (Desenvolvimento)
\`\`\`
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## Variáveis Disponíveis no Projeto v0

O projeto v0 já possui as seguintes variáveis configuradas automaticamente:
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `NEON_PROJECT_ID`

## Verificação

Para verificar se as variáveis estão carregadas corretamente, você pode adicionar um console.log temporário:

\`\`\`javascript
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'Não configurado');
\`\`\`

## Importante

- Nunca commite o arquivo `.env.local` no Git
- Use `.env.example` como template
- Mantenha as variáveis sensíveis seguras
