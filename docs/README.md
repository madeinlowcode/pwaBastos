# Documentação - PWA Consultas Médicas

Bem-vindo à documentação completa do sistema PWA Consultas Médicas, uma aplicação web progressiva para agendamento e gerenciamento de consultas médicas.

## 📋 Sobre o Projeto

O **PWA Consultas** é uma Progressive Web App (PWA) desenvolvida para facilitar o agendamento e acompanhamento de consultas médicas. O sistema oferece funcionalidades offline, notificações push em tempo real e uma interface responsiva otimizada para dispositivos móveis e desktop.

## 🎯 Funcionalidades Principais

- **Gerenciamento de Consultas**: Criação, visualização e atualização de agendamentos médicos
- **Autenticação de Usuários**: Sistema de login seguro com bcrypt
- **Notificações Push**: Lembretes automáticos de consultas via Web Push API
- **Modo Offline**: Funcionalidade completa mesmo sem conexão à internet
- **Instalável**: Pode ser instalada como aplicativo nativo em dispositivos móveis e desktop
- **Perfil de Usuário**: Gerenciamento de dados pessoais e foto de perfil
- **Interface Responsiva**: Design mobile-first otimizado para todos os tamanhos de tela

## 🚀 Início Rápido

### Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- Conta Supabase (para hospedagem do banco de dados)

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd pwaBastos
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

4. Gere as chaves VAPID para notificações push:
```bash
node generate-vapid-keys.js
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação em `http://localhost:3000`

## 📚 Estrutura da Documentação

Esta documentação está organizada nos seguintes arquivos:

- **[Arquitetura](./arquitetura.md)** - Visão geral da arquitetura, tecnologias e padrões utilizados
- **[Estrutura de Pastas](./estrutura-pastas.md)** - Organização de diretórios e arquivos do projeto
- **[Componentes](./componentes.md)** - Descrição detalhada dos componentes frontend e backend
- **[Integrações](./integracoes.md)** - Documentação das integrações externas (Banco de dados, Web Push, etc.)
- **[API](./api.md)** - Referência completa das rotas e endpoints da API
- **[Banco de Dados](./banco-de-dados.md)** - Esquema e estrutura do banco de dados
- **[Deploy](./deploy.md)** - Guia passo a passo para deploy em produção

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Ambiente de execução JavaScript
- **Express.js** - Framework web minimalista
- **PostgreSQL** - Banco de dados relacional
- **Supabase** - Plataforma de hospedagem PostgreSQL
- **bcrypt** - Criptografia de senhas
- **express-session** - Gerenciamento de sessões

### Frontend
- **Handlebars** - Template engine
- **Vanilla JavaScript** - JavaScript puro sem frameworks
- **CSS3** - Estilização com sistema de design customizado
- **FontAwesome** - Biblioteca de ícones
- **SweetAlert2** - Alertas e modais elegantes

### PWA
- **Service Worker** - Cache e funcionalidade offline
- **Web Push API** - Notificações push
- **Web App Manifest** - Configuração de instalação

## 📱 Comandos Disponíveis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Produção
npm start

# Gerar chaves VAPID
node generate-vapid-keys.js

# Criar usuário de teste
node create-test-user.js

# Verificar usuários existentes
node check-users.js
```

## 🔐 Segurança

O projeto implementa diversas práticas de segurança:

- Senhas criptografadas com bcrypt
- Sessões seguras com express-session
- Variáveis de ambiente para dados sensíveis
- Validação de dados em todas as requisições
- Proteção de rotas com middleware de autenticação

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para questões e suporte:
- Abra uma issue no repositório
- Entre em contato através do email: suporte@pwaconsultas.com

---

**Última atualização**: Janeiro 2025
