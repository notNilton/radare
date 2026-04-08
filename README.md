# Radare - Sistema de Reconciliação de Dados Técnicos

Radare é uma plataforma web para reconciliação de dados em processos industriais e financeiros, utilizando o método dos multiplicadores de Lagrange e testes estatísticos de consistência (Qui-quadrado).

## 🚀 Tecnologias

- **Backend:** Go (Golang) + GORM + Postgres + Gonum
- **Frontend:** React + TypeScript + Vite + Zustand + ReactFlow + PrimeReact
- **DevOps:** Docker + Docker Compose

## 🛠️ Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos
1. Clone o repositório.
2. Na raiz do projeto, execute:
   ```bash
   docker compose up --build
   ```
3. Acesse o webapp em `http://localhost:5173`.
4. O backend estará disponível em `http://localhost:8080`.

## 📂 Estrutura do Projeto

- `/apps/backend`: API REST em Go.
- `/apps/webapp`: Interface do usuário em React.
- `/database`: módulo compartilhado de conexão e evolução de banco.
- `/client-api`: coleção Bruno para smoke tests e validação manual.
- `/docs`: documentação técnica e planos de desenvolvimento.

## 📝 Documentação Complementar

- [Planos de Desenvolvimento (TODO)](docs/TODO.md)
- [Backend README](docs/designs/backend.md)
- [Webapp README](docs/designs/webapp.md)
- [API Client (Bruno)](docs/designs/client-api.md)
- [Blueprint de Refatoração](docs/refactors/MONOREPO-REFACTOR.md)
