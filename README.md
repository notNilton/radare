# Radare - Sistema de Reconciliação de Dados Técnicos

Radare é uma plataforma industrial de alta performance para reconciliação de dados em processos complexos. Utiliza o método dos Multiplicadores de Lagrange e validação estatística via Teste de Qui-quadrado ($\chi^2$) para garantir a integridade de balanços de massa e energia.

## 🚀 Tecnologias Core

- **Backend:** Go (Golang) + GORM + Postgres + Gonum (Álgebra Linear)
- **Frontend:** React 19 + TypeScript + React Flow (Grafos) + TanStack Router/Query
- **Infraestrutura:** Docker + Redis (Cache) + WebSockets (Real-time)
- **Qualidade:** Playwright (E2E) + Testcontainers (Integration) + Swagger (OpenAPI)

## 🛠️ Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos
1. Clone o repositório.
2. Na raiz do projeto, execute o bootstrap da stack:
   ```bash
   docker compose up --build
   ```
3. Acesse o webapp em `http://localhost:5173`.
4. Explore a documentação interativa da API (Swagger) em `http://localhost:8080/swagger/index.html`.

## 📂 Estrutura do Monorepo

- [`/apps/backend`](apps/backend): API RESTful e Motor Matemático em Go.
- [`/apps/webapp`](apps/webapp): SPA em React para modelagem visual e dashboards.
- [`/database`](database): Módulo isolado para gestão de schema, migrations e seeds.
- [`/client-api`](client-api): Coleção Bruno para testes de contrato e validação manual.
- [`/docs`](docs): Inteligência do projeto, referências e roadmap.

## 📝 Inteligência do Projeto (Documentação)

O Radare é um projeto fundamentado em engenharia pesada. Explore nossa base de conhecimento:

### 📖 Planejamento e Roadmap
- [**Master TODO List**](docs/planning/00-MASTER-TODO.md): Visão geral do progresso das Fases 1 a 10.
- [**Estratégias por Fase**](docs/planning/): Detalhamento técnico de cada etapa do desenvolvimento (Arquitetura, Inteligência, Conectividade, Multi-tenant).

### 🧠 Base de Conhecimento e Referências
- [**Teoria de Reconciliação**](docs/references/01-RECONCILIATION-THEORY.md): Bibliografia fundamental, papers e normas ISO/ISA.
- [**Lógica de Software**](docs/references/02-SOFTWARE-LOGIC.md): Padrões arquiteturais, concorrência em Go e design de sistemas.

### 📢 Comunicação Técnica (LinkedIn)
- [**Série: Deep-Dive na Fase 4**](docs/linkedin-posts/): Posts técnicos detalhando os desafios de Persistência, Qui-quadrado, Heatmaps e Sparklines.

---
*Radare - Engineering Intelligence for Industrial Assets.*
