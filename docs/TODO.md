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
- [ ] **Estado e Navegação**
    - [ ] Configurar Zustand ou Context API para estado global.
    - [ ] Implementar Rotas Protegidas (Private Routes).
- [ ] **Integração API**
    - [ ] Interceptor Axios/Fetch para JWT.
    - [ ] Tratamento global de erros (401, 500).
- [ ] **Interface do Grafo (Canva)**
    - [ ] Lógica de conexão entre nós em `Reconciliacao.tsx`.
    - [ ] Interatividade nos nós customizados.

## 🛠️ DevOps & Qualidade
- [ ] **Docker**
    - [ ] Otimizar `docker-compose.yml` (incluir DB persistente).
    - [ ] Dockerfile multi-stage para Go.
- [ ] **Testes**
    - [ ] Testes unitários para lógica de reconciliação.
    - [ ] Testes de componentes no React.
- [ ] **Documentação**
    - [ ] Atualizar coleção Bruno (`docs/apiclient`).
    - [ ] README.md com instruções de setup.
