# 01 - Estratégia da Fase 1: Fundação e Motor de Lagrange

> **Status: [x] Concluída** — Monorepo ✅ | Motor de Lagrange ✅ | Auth Base ✅ | React Flow Base ✅

A Fase 1 estabeleceu a fundação matemática e arquitetural do **Radare**. O foco foi sair do zero para um sistema capaz de resolver sistemas lineares de balanço de massa via Multiplicadores de Lagrange em um ambiente monorepo de alta performance e fácil manutenção.

---

## 1. Arquitetura Monorepo e Infraestrutura

### 🚀 Backend & DevOps
- [x] **Monorepo Pattern:** Organização física em `apps/`, `database/` e `client-api/`. Essa estrutura permite que as mudanças de contrato no banco reflitam instantaneamente no backend e sejam validadas no frontend em um único commit atômico.
- [x] **Containerização e Orquestração (Docker):** Setup de ambiente multi-container com `docker-compose`. 
    - **db:** PostgreSQL 18-alpine para persistência ácida.
    - **migrate:** Worker efêmero em Go para evolução de schema.
- [x] **Módulo Database Isolado:** Criação de um binário de migração próprio (`database/cmd/migrate`) para gerenciar o ciclo de vida do schema via SQL puro, garantindo que o banco seja um domínio operacional de primeira classe.

---

## 2. O Motor de Reconciliação (Core Engine)

### 🚀 Backend
- [x] **Algoritmo de Lagrange (Linear Solver):** Implementação do solver para minimização da função objetivo sujeita a restrições de balanço ($Ax = 0$).
    - [x] **Matriz de Incidência (A):** Algoritmo para converter a topologia do grafo (nós e arestas) em uma matriz de restrições lineares.
    - [x] **Resolução Matricial:** Uso da biblioteca `gonum` para operações de álgebra linear, permitindo o cálculo dos multiplicadores e o ajuste preciso das variáveis medidas ($x_{adj} = x_{meas} - V A^T \lambda$).
- [x] **Logging Estruturado (`slog`):** Implementação de telemetria inicial focada na performance do solver e diagnóstico de matrizes singulares ou mal condicionadas.

---

## 3. Identidade e Interface Base

### 🚀 Backend
- [x] **Auth Service (JWT):** Implementação de autenticação via JSON Web Tokens com hashing `bcrypt`. O backend utiliza `http.ServeMux` (Go stdlib) para manter a stack leve e resiliente.

### 🎨 Frontend
- [x] **React Flow Integration:** Escolha da biblioteca de grafos para permitir a modelagem visual de plantas industriais.
- [x] **State Management (Zustand):** Gestão de estado leve para sincronizar o desenho do canvas com os payloads de reconciliação enviados à API.
- [x] **Industrial Matte Theme:** Definição inicial dos tokens de design (CSS Variables) focados em redução de fadiga visual para operadores.

---

## 🧪 Estratégia de Validação
- [x] **Cálculo Base:** Testes unitários comparando os resultados do solver em Go com matrizes resolvidas manualmente (casos de 1 nó e 3 correntes).
- [x] **Integration:** Fluxo completo de `Register -> Login -> POST /reconcile` validado via coleção Bruno (`client-api`).
