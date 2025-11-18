# Guia de Deploy

## 🚀 Visão Geral

Este documento fornece instruções completas para deploy do PWA Consultas em diferentes ambientes de produção.

## 📋 Índice

- [Requisitos de Produção](#requisitos-de-produção)
- [Deploy no Heroku](#deploy-no-heroku)
- [Deploy no Render](#deploy-no-render)
- [Deploy no Railway](#deploy-no-railway)
- [Deploy em VPS (DigitalOcean, AWS EC2)](#deploy-em-vps)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [SSL/HTTPS](#sslhttps)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos de Produção

### Sistema Operacional
- Linux (Ubuntu 20.04+ recomendado)
- Windows Server 2019+
- macOS 11+

### Software
- **Node.js**: v14.x ou superior (v18.x recomendado)
- **npm**: v6.x ou superior
- **PostgreSQL**: v12 ou superior (ou Supabase)
- **Git**: Para versionamento

### Recursos Mínimos (VPS)
- **CPU**: 1 core
- **RAM**: 512 MB (1 GB recomendado)
- **Disco**: 10 GB
- **Banda**: 1 TB/mês

### Requisitos de Rede
- **HTTPS**: Obrigatório para PWA (Service Worker e Push Notifications)
- **Domínio**: Recomendado (ex: app.exemplo.com)
- **Certificado SSL**: Let's Encrypt (gratuito)

---

## 🌐 Deploy no Heroku

### Passo 1: Preparar o Projeto

**Criar arquivo `Procfile`:**

```bash
web: node server.js
```

**Adicionar script de start no `package.json`:**

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

**Especificar versão do Node:**

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Passo 2: Criar App no Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Criar app
heroku create pwa-consultas

# Adicionar PostgreSQL (ou usar Supabase)
heroku addons:create heroku-postgresql:mini
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# SESSION_SECRET
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# VAPID Keys (gerar com generate-vapid-keys.js)
heroku config:set PUBLIC_VAPID_KEY="sua_public_key"
heroku config:set PRIVATE_VAPID_KEY="sua_private_key"
heroku config:set VAPID_MAILTO="mailto:seu-email@exemplo.com"

# Banco de dados (se usar Supabase)
heroku config:set DB_HOST="db.supabase.co"
heroku config:set DB_PORT="5432"
heroku config:set DB_DATABASE="postgres"
heroku config:set DB_USER="postgres"
heroku config:set DB_PASSWORD="sua_senha_supabase"

# Porta (Heroku define automaticamente)
# Não precisa definir PORT manualmente
```

### Passo 4: Deploy

```bash
# Adicionar remote do Heroku
git remote add heroku https://git.heroku.com/pwa-consultas.git

# Deploy
git push heroku main

# Ver logs
heroku logs --tail

# Abrir app
heroku open
```

### Passo 5: Criar Tabelas no Banco

```bash
# Conectar ao banco
heroku pg:psql

# Executar SQL de criação de tabelas (do arquivo banco-de-dados.md)
```

---

## 🎨 Deploy no Render

### Passo 1: Criar Conta no Render

Acesse https://render.com e crie uma conta.

### Passo 2: Novo Web Service

1. Clique em **New +** → **Web Service**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: pwa-consultas
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (ou Starter)

### Passo 3: Configurar Variáveis de Ambiente

Na aba **Environment**, adicione:

```
SESSION_SECRET=string_longa_e_aleatoria
PUBLIC_VAPID_KEY=sua_public_key
PRIVATE_VAPID_KEY=sua_private_key
VAPID_MAILTO=mailto:seu-email@exemplo.com
DB_HOST=db.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
NODE_ENV=production
```

### Passo 4: Deploy

Render faz deploy automaticamente ao detectar push no GitHub.

**Ver logs:**
- Acesse o dashboard do Render
- Clique em **Logs**

**URL da aplicação:**
- `https://pwa-consultas.onrender.com`

---

## 🚂 Deploy no Railway

### Passo 1: Criar Conta no Railway

Acesse https://railway.app e crie uma conta.

### Passo 2: Novo Projeto

1. Clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Escolha o repositório

### Passo 3: Configurar Variáveis

Na aba **Variables**, adicione todas as variáveis de ambiente.

### Passo 4: Adicionar PostgreSQL (Opcional)

Se não usar Supabase:

1. Clique em **New** → **Database** → **PostgreSQL**
2. Railway configura automaticamente `DATABASE_URL`

### Passo 5: Deploy

Deploy automático ao fazer push.

**Configurar domínio:**
- **Settings** → **Domains** → **Generate Domain**

---

## 🖥️ Deploy em VPS

### Opção 1: DigitalOcean Droplet

#### Passo 1: Criar Droplet

1. Acesse DigitalOcean
2. Create → Droplets
3. Escolha:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/mês)
   - **Datacenter**: Mais próximo dos usuários

#### Passo 2: Conectar via SSH

```bash
ssh root@seu-ip-do-droplet
```

#### Passo 3: Instalar Node.js

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalação
node -v
npm -v
```

#### Passo 4: Instalar Git

```bash
apt install -y git
```

#### Passo 5: Clonar Repositório

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar
git clone https://github.com/seu-usuario/pwaBastos.git
cd pwaBastos

# Instalar dependências
npm install --production
```

#### Passo 6: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

Adicionar:

```env
PORT=3000
SESSION_SECRET=string_longa_e_aleatoria
PUBLIC_VAPID_KEY=sua_public_key
PRIVATE_VAPID_KEY=sua_private_key
VAPID_MAILTO=mailto:seu-email@exemplo.com
DB_HOST=db.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
NODE_ENV=production
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

#### Passo 7: Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name pwa-consultas

# Configurar para iniciar no boot
pm2 startup systemd
pm2 save

# Ver logs
pm2 logs pwa-consultas

# Monitorar
pm2 monit
```

#### Passo 8: Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
apt install -y nginx

# Criar configuração
nano /etc/nginx/sites-available/pwa-consultas
```

Adicionar:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar configuração
ln -s /etc/nginx/sites-available/pwa-consultas /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

#### Passo 9: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já configurada)
certbot renew --dry-run
```

#### Passo 10: Configurar Firewall

```bash
# Habilitar UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Verificar status
ufw status
```

### Opção 2: AWS EC2

Similar ao DigitalOcean, mas use AMI Ubuntu e configure Security Groups para permitir HTTP (80) e HTTPS (443).

---

## 🗄️ Configuração do Banco de Dados

### Supabase (Recomendado)

#### Passo 1: Criar Projeto

1. Acesse https://supabase.com
2. **New Project**
3. Escolha nome, senha e região

#### Passo 2: Obter Credenciais

**Settings** → **Database** → **Connection string**

Copiar:
- Host
- Port
- Database name
- User
- Password

#### Passo 3: Criar Tabelas

**SQL Editor** → Executar SQL de criação de tabelas (arquivo `banco-de-dados.md`)

### PostgreSQL Auto-Hospedado

Se preferir hospedar seu próprio PostgreSQL:

```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Criar banco e usuário
sudo -u postgres psql

CREATE DATABASE pwa_consultas;
CREATE USER pwa_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE pwa_consultas TO pwa_user;
\q

# Executar SQL de criação de tabelas
psql -U pwa_user -d pwa_consultas -f schema.sql
```

---

## 🔐 Variáveis de Ambiente

### Exemplo Completo de `.env`

```env
# Servidor
PORT=3000
NODE_ENV=production

# Sessão
SESSION_SECRET=crie_uma_string_muito_longa_e_aleatoria_aqui

# Banco de Dados (Supabase)
DB_HOST=db.xxxxxxxxxx.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_super_segura

# Web Push (VAPID)
PUBLIC_VAPID_KEY=BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PRIVATE_VAPID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_MAILTO=mailto:admin@seu-dominio.com
```

### Gerar SESSION_SECRET

```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Gerar VAPID Keys

```bash
node generate-vapid-keys.js
```

---

## 🔒 SSL/HTTPS

### Por Que HTTPS é Obrigatório?

- **Service Worker**: Apenas funciona com HTTPS
- **Push Notifications**: Requer HTTPS
- **PWA**: Instalação requer HTTPS
- **Segurança**: Protege dados do usuário

### Certificado SSL Gratuito (Let's Encrypt)

```bash
# Já coberto na seção de VPS
certbot --nginx -d seu-dominio.com
```

### Renovação Automática

Let's Encrypt renova automaticamente, mas teste:

```bash
certbot renew --dry-run
```

### Atualizar server.js para Produção

```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // true em produção
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7  // 7 dias
  }
}));
```

---

## 📊 Monitoramento

### PM2 Monitoring

```bash
# Instalar PM2 Plus (opcional, gratuito para 1 servidor)
pm2 register

# Ver métricas
pm2 monit

# Ver logs em tempo real
pm2 logs

# Verificar status
pm2 status
```

### Logs da Aplicação

```bash
# PM2 logs
pm2 logs pwa-consultas

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Ferramentas Externas

- **UptimeRobot**: Monitoramento de uptime (gratuito)
- **LogRocket**: Monitoramento de erros frontend
- **Sentry**: Rastreamento de erros
- **Google Analytics**: Análise de uso

---

## 🧪 Checklist de Deploy

### Antes do Deploy

- [ ] Testes locais passando
- [ ] `.env` configurado (não versionado)
- [ ] VAPID keys geradas
- [ ] Banco de dados criado e configurado
- [ ] SSL/HTTPS configurado
- [ ] Domínio apontando para o servidor

### Durante o Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados populado (schema)
- [ ] Service worker funcionando (HTTPS)
- [ ] Push notifications testadas

### Após o Deploy

- [ ] Aplicação acessível via HTTPS
- [ ] Login funcionando
- [ ] CRUD de consultas funcionando
- [ ] Notificações push funcionando
- [ ] PWA instalável
- [ ] Service worker cacheando recursos
- [ ] Logs sem erros

---

## 🐛 Troubleshooting

### Problema: Service Worker Não Registra

**Causa**: Aplicação não está em HTTPS

**Solução**:
- Configurar SSL/HTTPS (Let's Encrypt)
- Em desenvolvimento, `localhost` funciona sem HTTPS

### Problema: Notificações Não Funcionam

**Causa**: VAPID keys incorretas ou HTTPS não configurado

**Solução**:
1. Verificar `PUBLIC_VAPID_KEY` e `PRIVATE_VAPID_KEY` no `.env`
2. Regenerar keys se necessário
3. Confirmar HTTPS ativo

### Problema: Erro de Conexão com Banco

**Causa**: Credenciais incorretas ou firewall

**Solução**:
1. Verificar variáveis `DB_*` no `.env`
2. Testar conexão:
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_DATABASE
   ```
3. Verificar whitelist de IPs no Supabase

### Problema: Sessões Não Persistem

**Causa**: `SESSION_SECRET` não definido ou cookies não seguros

**Solução**:
1. Definir `SESSION_SECRET` no `.env`
2. Configurar `secure: true` apenas em produção com HTTPS

### Problema: Aplicação Não Inicia no PM2

**Causa**: Erro no código ou variáveis de ambiente

**Solução**:
```bash
# Ver logs de erro
pm2 logs pwa-consultas --err

# Reiniciar
pm2 restart pwa-consultas

# Ver status detalhado
pm2 show pwa-consultas
```

### Problema: 502 Bad Gateway (Nginx)

**Causa**: Aplicação Node.js não está rodando

**Solução**:
```bash
# Verificar se Node.js está rodando
pm2 status

# Reiniciar se necessário
pm2 restart pwa-consultas

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log
```

---

## 🔄 Atualizações

### Deploy de Novas Versões

#### Heroku/Render/Railway

```bash
# Commit mudanças
git add .
git commit -m "Nova funcionalidade"

# Push (deploy automático)
git push origin main
```

#### VPS com PM2

```bash
# SSH no servidor
ssh root@seu-ip

# Navegar para o projeto
cd /var/www/pwaBastos

# Pull das mudanças
git pull origin main

# Instalar novas dependências (se houver)
npm install --production

# Reiniciar aplicação
pm2 restart pwa-consultas

# Verificar logs
pm2 logs pwa-consultas
```

---

## 📈 Otimizações de Produção

### Compression

Adicionar compressão gzip:

```bash
npm install compression
```

```javascript
// server.js
const compression = require('compression');
app.use(compression());
```

### Rate Limiting

Prevenir ataques de força bruta:

```bash
npm install express-rate-limit
```

```javascript
// server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições por IP
});

app.use('/api/', limiter);
```

### Helmet (Segurança)

```bash
npm install helmet
```

```javascript
// server.js
const helmet = require('helmet');
app.use(helmet());
```

---

## 🎉 Conclusão

Parabéns! Sua aplicação PWA Consultas está agora em produção.

**Recursos Adicionais:**
- [Documentação do Heroku](https://devcenter.heroku.com/)
- [Documentação do Render](https://render.com/docs)
- [Documentação do PM2](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Supabase Docs](https://supabase.com/docs)

---

**Voltar para**: [README](./README.md) | [Arquitetura](./arquitetura.md)
