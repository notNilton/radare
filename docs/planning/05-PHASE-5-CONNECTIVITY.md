# 05 - Estratégia da Fase 5: Conectividade e Enterprise

> **Status: [x] Concluída** — Dual DB ✅ | Particionamento ✅ | Audit Logs ✅ | PDF Export ✅ | Workspace Versioning ✅ | RBAC ✅ | Redis + MQTT + Influx ✅ | WebSocket Hub + Notificações ✅ | PWA ✅ | Temas ✅

A Fase 5 foca na integração do **Radare** com ecossistemas industriais externos, segurança granular e uma fundação de dados de alta performance (Redis + Dual DB + Snapshotting).

---

## 1. Infraestrutura de Dados e Alta Performance

### 🚀 Backend
- [x] **Dual Database Architecture (Separation of Concerns):**
    - [x] **Truth DB (Postgres Main):** Apenas dados lógicos, configurações de tags e usuários.
    - [x] **LogDB (Postgres Observability):** Instância isolada para logs de auditoria, históricos de erro e snapshots efêmeros.
- [x] **Real-time Ingestion Layer (Redis):**
    - [x] Implementar Redis como buffer de alta velocidade para "Current Values" das tags.
    - [x] Evitar escritas excessivas no Postgres: o worker MQTT/Influx escreve no Redis; o Postgres é atualizado apenas em intervalos ou quando uma reconciliação é consolidada.
- [x] **Workspace Versioning (Snapshotting):**
    - [x] Implementar imutabilidade na topologia: cada alteração no canvas gera uma nova versão (UUID) no banco.
    - [x] Histórico de Reconciliação deve apontar para o ID da versão do grafo usada no momento do cálculo.
- [x] **Table Partitioning (Scalability):**
    - [x] Preparar a tabela de resultados históricos para particionamento nativo do Postgres por tempo (mensal).

---

## 2. Conectividade e Ingestão Automática

### 🚀 Backend
- [x] **Data Ingestion Workers (MQTT & InfluxDB):**
    - [x] Criar workers em Go que assinam tópicos industriais e atualizam o cache do Redis.
    - [x] Interface de Mapeamento (De-Para): tela para vincular nomes de tags externas aos IDs internos do Radare.
- [x] **Relatórios Executivos (PDF):**
    - [x] Geração de sumários estatísticos formatados (pure-Go PDF) integrando dados de balanço e erros brutos.

### 🎨 Frontend
- [x] **Dashboard de Conectividade:**
    - [x] Visualização do status dos conectores (Online/Offline/Latência).
    - [x] Interface para gerenciamento de chaves de API para ingestão externa.

---

## 3. Segurança e Governança (RBAC & Audit)

### 🚀 Backend
- [x] **Controle de Acesso Baseado em Papéis (RBAC):**
    - [x] Perfis: `Admin` (gestão total), `Operador` (execução e edição), `Auditor` (somente leitura de histórico).
- [x] **Audit Logs (Persistidos no LogDB):**
    - [x] Registro detalhado de quem alterou configurações críticas de tags ou deletou workspaces.

---

## 4. UX e Resiliência (Mobile & PWA)

### 🎨 Frontend
- [x] **PWA (Progressive Web App):**
    - [x] Configurar `vite-plugin-pwa` + Workbox Service Worker para instalação e suporte offline básico.
- [x] **Notificações Push (WebSocket):**
    - [x] `hub.go` — fan-out hub singleton com `Broadcast(type, payload)`.
    - [x] `useNotifications.ts` — WebSocket consumer com auto-reconexão; mapeia eventos em toasts.
    - [x] `NotificationStore.ts` — Zustand store `push/dismiss/clear` (máx. 20).
    - [x] `Notifications.tsx` — overlay de toasts com auto-dismiss em 6 s e ícones por nível.

---

## 📅 Cronograma Sugerido (Refinado)

- [x] **Semana 1:** Setup do Redis e LogDB (Docker Compose + Conexões em Go).
- [x] **Semana 2:** Implementação de Workspace Versioning e Ingestão MQTT básica.
- [x] **Semana 3:** Estrutura de RBAC e Audit Logs.
- [x] **Semana 4:** PWA, Notificações e Relatórios PDF.
