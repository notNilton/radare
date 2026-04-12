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
- [x] **Persistência de Grafos:** Salvar e carregar layouts de nós e arestas no banco de dados.
- [x] **Detecção de Erros Brutos:** Implementar Teste Global (Qui-quadrado) para identificar vazamentos ou sensores defeituosos.
- [x] **Engine de Projetos:** Suporte a múltiplos "Workspaces" ou "Processos" independentes.
- [x] **Visualização de Tendências:** Gráficos de série temporal (Medido vs Reconciliado) por tag.
- [x] **Heatmaps no Grafo:** Colorir arestas no canvas baseando-se na magnitude da correção aplicada.

---

## 📊 Fase 5 - Conectividade e Enterprise (Atual)

### 🚀 Backend (Infraestrutura & Ingestão)
- [x] **Dual Database Architecture:** Configurar banco secundário (LogDB) isolado para logs e auditoria.
- [x] **Real-time Ingest Layer (Redis):** Buffer de alta performance para valores atuais das tags.
- [x] **Workspace Versioning:** Snapshotting imutável de topologias de grafos para rastreabilidade.
- [x] **Table Partitioning:** Particionamento mensal de tabelas de histórico no Postgres.
- [x] **Data Ingestion Workers:** Implementar workers em Go para MQTT e InfluxDB.
- [x] **Mapeamento dinâmico:** Interface para De-Para de tags externas para internas.
- [x] **Exportação PDF:** Gerador de relatórios executivos com sumário estatístico e gráficos.

### 🎨 Frontend (Segurança & UX)
- [x] **Dashboard de Conectividade:** Visualização de status e latência dos conectores externos.
- [x] **RBAC UI:** Interface de permissões por perfis (Admin, Operador, Auditor).
- [x] **PWA & Offline:** `vite-plugin-pwa` + Workbox Service Worker + manifesto para instalação mobile/desktop.
- [x] **Notificações Push:** Hub WebSocket fan-out, `NotificationStore`, `useNotifications`, toast overlay com auto-dismiss.

- [x] **Temas Customizados:** Salvamento de preferência (Industrial, Dark, Light) no perfil do usuário.

---

## 💎 Fase 6 - Evolução Multi-Tenant e Escala

### 🚀 Backend (Arquitetura SaaS)
- [ ] **Isolamento de Dados:** Implementar `tenant_id` e Row Level Security (RLS) no Postgres.
- [ ] **Hierarquia de Ativos:** Cadastro de `Facilities`, `Assets` e versionamento de templates.
- [ ] **Processamento Assíncrono:** Fila de `Jobs` para reconciliações de larga escala.
- [ ] **Idempotência:** Garantir integridade de execuções simultâneas via chaves únicas.
- [ ] **Outbox Pattern:** Garantir consistência eventual entre persistência e notificações externas.

### 🎨 Frontend (Gestão Enterprise)
- [ ] **Switch de Workspace/Tenant:** Interface para troca rápida de contexto de empresa.
- [ ] **Dashboard Multi-Unidade:** Visão agregada de performance entre diferentes plantas.

---

## ⚙️ Fase 07 - Otimização Heurística e Algoritmos Genéticos

### 🚀 Backend (Advanced Engineering)
- [ ] **Genetic Algorithm Solver:** Implementar solver para encontrar pesos ideais de sensores onde a variância é desconhecida.
- [ ] **Constraint Programming:** Adicionar restrições de desigualdade (ex: vazão mínima em válvulas) no cálculo de reconciliação.
- [ ] **Detecção de Drift:** Algoritmo para identificar degradação de precisão em sensores ao longo do tempo.

---

## 🛡️ Fase 08 - Stress Testing e Robustez de Dados

### 🧪 Qualidade Industrial
- [ ] **Data Fuzzing:** Engine para injetar dados sintéticos corrompidos e testar a resiliência do algoritmo de Qui-quadrado.
- [ ] **Sanity Checker:** Validador termodinâmico básico para impedir resultados fisicamente impossíveis.
- [ ] **Monte Carlo Simulations:** Executar múltiplas reconciliações com perturbação nos inputs para análise de incerteza.

---

## 🏗️ Fase 09 - Integração de Campo e Edge Computing

### 🔌 Conectividade Real
- [ ] **Radare Edge:** Versão leve para rodar em ARM/Gateways de campo via Docker.
- [ ] **Local Buffering:** Persistência temporária em SQLite no Edge para casos de queda de link com a nuvem.
- [ ] **Protocols V2:** Implementar suporte nativo a OPC-UA e Modbus TCP.

---

## 🌐 Fase 10 - Digital Twins e Alta Disponibilidade

### 🚀 Escala Global
- [ ] **Federated Sync:** Sincronização entre múltiplas instâncias regionais do Radare.
- [ ] **3D Process Mapping:** Interface para mapear o grafo sobre modelos 3D (BIM) simplificados no frontend.
- [ ] **Disaster Recovery:** Replicação geográfica de banco de dados e failover automático.
