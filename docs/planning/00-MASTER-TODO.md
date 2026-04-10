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
- [x] **Testes**
    - [x] Testes unitários para lógica de reconciliação.
    - [x] Testes de componentes no React (Vitest + Testing Library).

## 📄 Documentação
- [x] **Manutenção**
    - [x] Atualizar coleção Bruno (`client-api`).
    - [x] README.md com instruções de setup.

---

## ⚡ Fase 2 - Expansão

### 🚀 Backend (Melhorias)
- [x] **Refresh Token:** Implementar renovação automática de sessão.
- [x] **Exportação:** Rota para exportar resultados em CSV/Excel (`/api/reconcile/export`).
- [x] **Filtros Avançados:** Busca e paginação no histórico de reconciliações.

### 🎨 Frontend (Novas Funcionalidades)
- [x] **Gestão de Perfil:** Página para visualizar e editar dados do usuário (`/api/profile`).
- [x] **Gestão de Tags:** Interface CRUD para instrumentos e tags (`/api/tags`).
- [x] **Dashboard e Histórico:** Visualização de estatísticas e histórico de reconciliações.
- [x] **Componentes UI:** Refinar estilos com PrimeReact para tabelas e gráficos.

### 🛠️ DevOps & CI/CD (Gitea Actions)
- [x] **CI Pipeline:** Configurar workflow para rodar testes de Go e Vitest no Gitea.
- [x] **Docker Build:** Automatizar o build das imagens no registry.

---

## 💎 Fase 3 - Profissionalização e Monitoramento

### 🚀 Backend (Robustez)
- [x] **Swagger/OpenAPI:** Implementar documentação automática com `swaggo`.
- [x] **Validação de Dados:** Integrar `go-playground/validator` nos handlers.
- [x] **WebSockets:** Notificações em tempo real para o Dashboard (`gorilla/websocket`).
- [x] **Filtros de Histórico:** Implementar busca por data e status no banco.

### 🎨 Frontend (UX & Resiliência)
- [x] **Gestão de Erros:** Implementar `ErrorBoundary` global e centralizar Toasts.
- [x] **Monitoramento Real-time:** Consumir dados via WebSocket no Dashboard.
- [x] **Filtros Avançados:** Interface de busca refinada na página de histórico.

### 🧪 Qualidade & E2E
- [x] **Testes E2E:** Configurar Playwright para validar o fluxo principal (Login -> Reconciliar).
- [x] **Testes de Integração:** Criar testes de repositório no Go com banco real (testcontainers).

---

## 🏗️ Fase 4 - Inteligência Operacional e Persistência

### 🚀 Backend (Cérebro Estatístico)
- [ ] **Persistência de Grafos:** Salvar e carregar layouts de nós e arestas no banco de dados.
- [ ] **Detecção de Erros Brutos:** Implementar Teste Global (Qui-quadrado) para identificar vazamentos ou sensores defeituosos.
- [ ] **Engine de Projetos:** Suporte a múltiplos "Workspaces" ou "Processos" independentes.

### 🎨 Frontend (Análise Visual)
- [ ] **Visualização de Tendências:** Gráficos de série temporal (Medido vs Reconciliado) por tag.
- [ ] **Heatmaps no Grafo:** Colorir arestas no canvas baseando-se na magnitude da correção aplicada.
- [ ] **Undo/Redo:** Implementar histórico de ações no editor de grafos.

---

## 📊 Fase 5 - Conectividade e Enterprise

### 🚀 Integração e Relatórios
- [ ] **Exportação PDF:** Gerador de relatórios executivos com sumário estatístico e gráficos.
- [ ] **Ingestão Automática:** Criar workers para ler dados de fontes externas (MQTT/SQL/InfluxDB).
- [ ] **RBAC (Role-Based Access Control):** Níveis de permissão (Admin, Operador, Auditor).

### 🛠️ UX e Resiliência
- [ ] **PWA (Progressive Web App):** Suporte a instalação e funcionamento offline básico.
- [ ] **Temas Customizados:** Persistência de preferência de tema (Dark/Light/Industrial) no perfil do usuário.
- [ ] **Notificações Push:** Alertas de inconsistência crítica via WebSocket/Browser Notifications.
