# Projeto Radare - TODO List

## 🚀 Backend (Golang)
- [x] **Autenticação e Segurança**
    - [x] Implementar JWT (JSON Web Tokens).
    - [x] Middleware de autenticação para rotas protegidas.
    - [x] Hashing de senhas com bcrypt no `user_handlers.go`.
- [x] **Banco de Dados**
    - [x] Configurar migrações automáticas (GORM).
    - [x] Refinar modelos de dados (`User`, `Tag`, `Reconciliation`).
- [x] **Lógica de Reconciliação**
    - [x] Implementar algoritmos de comparação (Lagrange + Qui-quadrado).
    - [x] Suporte a múltiplos formatos de entrada (CSV).
- [x] **Infraestrutura**
    - [x] Logging estruturado (slog).
    - [x] Healthcheck detalhado.

## 🎨 Frontend (React + TypeScript)
- [x] **Estado e Navegação**
    - [x] Configurar Zustand ou Context API para estado global.
    - [x] Implementar Rotas Protegidas (Private Routes).
- [x] **Integração API**
    - [x] Interceptor Axios/Fetch para JWT.
    - [x] Tratamento global de erros (401, 500).
- [x] **Interface do Grafo (Canva)**
    - [x] Lógica de conexão entre nós em `Reconciliacao.tsx`.
    - [x] Interatividade nos nós customizados.

## 🛠️ DevOps & Qualidade
- [x] **Docker**
    - [x] Otimizar `docker-compose.yml` (incluir DB persistente).
    - [x] Dockerfile multi-stage para Go.
- [ ] **Testes**
    - [x] Testes unitários para lógica de reconciliação.
    - [ ] Testes de componentes no React.
- [ ] **Documentação**
    - [ ] Atualizar coleção Bruno (`docs/apiclient`).
    - [ ] README.md com instruções de setup.
