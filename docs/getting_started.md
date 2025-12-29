# Getting Started - Primer

Este guia contém instruções passo a passo para configurar, instalar e rodar o projeto **Primer** em sua máquina local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas no seu sistema:

### 1. Ferramentas Básicas
- **Git**: Para clonar o repositório.
- **Node.js** (v18 ou superior) e **npm** (ou pnpm/yarn): Para o frontend.
- **Rust**: Para o backend Tauri. Instale via [rustup](https://rustup.rs/):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### 2. Dependências do Sistema (Linux)
Se você estiver no Linux, precisará instalar as dependências de desenvolvimento do sistema. No Ubuntu/Debian:

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```
*Nota: Para outras distribuições, consulte a [documentação oficial do Tauri](https://tauri.app/v1/guides/getting-started/prerequisites#linux).*

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório
```bash
git clone https://github.com/jefersonprimer/primer-desktop.git
cd primer-desktop
```

### 2. Configurar Variáveis de Ambiente
O projeto utiliza variáveis de ambiente para configurações sensíveis.

1. Navegue até a pasta `src-tauri`.
2. Copie o arquivo de exemplo `.env.example` para `.env`.

```bash
cd src-tauri
cp .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:
   - **Banco de Dados**: Configure `DATABASE_URL` (para Postgres/Supabase) ou `SQLITE_DATABASE_URL` (para SQLite local).
   - **Autenticação**: Defina `JWT_SECRET` (gere uma string segura) e os tempos de expiração.
   - **Google AI**: Adicione `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` se for utilizar funcionalidades do Google.
   - **Email**: Configure as variáveis `SMTP_*` para envio de emails.

### 3. Instalar Dependências
Volte para a raiz do projeto e instale as dependências do frontend e backend.

```bash
# Na raiz do projeto
npm install
```
*As dependências do Rust serão baixadas automaticamente na primeira compilação.*

### 4. Configurar o Banco de Dados
O projeto suporta PostgreSQL e SQLite. As migrações estão localizadas em `src-tauri/migrations`.

Se você tiver o `sqlx-cli` instalado, pode rodar as migrações manualmente. Caso contrário, o sistema pode tentar rodar automaticamente ao iniciar (verifique a implementação no código).

Para instalar o `sqlx-cli`:
```bash
cargo install sqlx-cli
```

Para criar o banco e rodar migrações (exemplo com SQLite):

```bash
cd src-tauri
# Certifique-se que a URL no .env está correta
sqlx database create
sqlx migrate run
```

## ▶️ Rodando o Projeto

Para iniciar o ambiente de desenvolvimento (com Hot Module Replacement):

```bash
npm run tauri dev
```
Isso iniciará o servidor Vite e abrirá a janela do aplicativo Tauri.

## 📦 Build para Produção

Para gerar o executável final otimizado:

```bash
npm run tauri build
```
Os artefatos gerados estarão em `src-tauri/target/release/bundle`.

## 🛠 Solução de Problemas Comuns

- **Erro de conexão com Banco**: Verifique se a `DATABASE_URL` no `.env` está correta e se o banco está acessível.
- **Dependências de Sistema**: Se o build falhar no Linux, verifique se todas as bibliotecas listadas nos pré-requisitos estão instaladas.
- **Permissões**: Certifique-se de ter permissões de execução nos scripts e acesso às pastas de build.
