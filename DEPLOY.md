# 🚀 Guia de Deploy na Vercel

Este guia explica como fazer o deploy do PWA de Consultas Médicas na Vercel.

## ✅ Código já está no GitHub!

Seu código já foi enviado para: **https://github.com/madeinlowcode/pwaBastos**

## 📋 Pré-requisitos

1. **Conta na Vercel**: Crie uma conta gratuita em [vercel.com](https://vercel.com)
2. **Banco de dados Supabase**: Deve estar configurado e rodando
3. **Chaves VAPID**: Use as chaves do seu arquivo `.env` local

## 🌐 Deploy na Vercel (Passo a Passo)

### 1. Acessar a Vercel

1. Vá para [vercel.com](https://vercel.com) e faça login
2. Conecte sua conta do GitHub se ainda não conectou
3. Clique em **Add New** > **Project**

### 2. Importar Repositório

1. Na lista de repositórios, encontre **madeinlowcode/pwaBastos**
2. Clique em **Import**

### 3. Configurar o Projeto

- **Framework Preset**: Other (ou deixe como detectado)
- **Root Directory**: deixe como está (`.`)
- **Build Command**: deixe vazio ou use `npm install`
- **Output Directory**: deixe vazio
- **Install Command**: `npm install`

### 4. Configurar Variáveis de Ambiente (IMPORTANTE!)

Clique em **Environment Variables** e adicione TODAS as seguintes variáveis com os valores do seu `.env` local:

```
SESSION_SECRET=sua_chave_secreta_forte_aqui
NODE_ENV=production
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
PUBLIC_VAPID_KEY=sua_chave_publica_vapid
PRIVATE_VAPID_KEY=sua_chave_privada_vapid
VAPID_MAILTO=mailto:seuemail@exemplo.com
```

**⚠️ IMPORTANTE:**
- Use os valores reais do seu arquivo `.env` local
- Não compartilhe essas chaves publicamente
- `SESSION_SECRET` deve ser uma string aleatória forte
- Se não tem chaves VAPID, execute localmente: `node generate-vapid-keys.js`

### 5. Deploy!

1. Clique em **Deploy**
2. Aguarde o build e deploy (leva ~2-3 minutos)
3. Após conclusão, você receberá uma URL (ex: `https://seu-projeto.vercel.app`)

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

1. **Aplicativo acessível**: Abra a URL fornecida pela Vercel
2. **Login funciona**: Teste o login com um usuário existente
3. **Banco de dados conecta**: Verifique se os dados são carregados
4. **Service Worker registra**: Abra DevTools > Application > Service Workers
5. **Notificações funcionam**: Teste as notificações push

## 🔧 Configurações Adicionais

### Domínio Personalizado

1. No dashboard da Vercel, vá para **Settings** > **Domains**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel

### Atualizar Variáveis de Ambiente

1. Vá para **Settings** > **Environment Variables**
2. Edite ou adicione variáveis
3. **Redeploy** o projeto para aplicar mudanças

### Ver Logs e Erros

- **Logs em tempo real**: Dashboard Vercel > seu projeto > **Logs**
- **Métricas**: Veja performance, visitas e erros
- **Runtime Logs**: Clique em qualquer deploy para ver logs detalhados

## 🐛 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão em `dependencies` no `package.json`
- Execute `npm install` localmente e faça commit se necessário

### Erro: "Environment variable not found"
- Verifique se TODAS as variáveis de ambiente foram configuradas na Vercel
- Variáveis são case-sensitive (maiúsculas/minúsculas importam)

### Erro: "Database connection failed"
- Verifique se as credenciais do Supabase estão corretas
- Confirme que o Supabase permite conexões externas
- Teste a conexão localmente primeiro

### Notificações não funcionam
- Verifique se as chaves VAPID foram configuradas corretamente
- Confirme que `VAPID_MAILTO` está no formato `mailto:seuemail@exemplo.com`
- Teste localmente primeiro para garantir que as chaves funcionam

### Uploads de imagem não persistem
- A Vercel usa sistema de arquivos efêmero (arquivos não persistem)
- **Solução**: Migre uploads para Supabase Storage, AWS S3, ou Cloudinary

## 🔄 Atualizações Futuras

Para fazer deploy de atualizações:

```bash
# Faça suas alterações no código
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

A Vercel detectará automaticamente o push e fará o redeploy!

## 📱 Instalar o PWA

Após o deploy, você pode instalar o app como PWA:

1. **No Chrome/Edge (Desktop)**: Clique no ícone de instalação na barra de endereço
2. **No Chrome (Android)**: Menu > Adicionar à tela inicial
3. **No Safari (iOS)**: Compartilhar > Adicionar à Tela de Início

## 📚 Recursos Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Supabase Docs](https://supabase.com/docs)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**✨ Seu PWA de Consultas Médicas agora está pronto para deploy!**

Repositório: https://github.com/madeinlowcode/pwaBastos
