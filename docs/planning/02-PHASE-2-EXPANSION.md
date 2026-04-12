# 02 - Estratégia da Fase 2: Expansão Operacional e Dados

> **Status: [x] Concluída** — Tag CRUD ✅ | Session Logic ✅ | Export CSV ✅ | CI/CD Publishing ✅

A Fase 2 elevou o Radare de um protótipo para uma ferramenta operacional funcional, introduzindo o domínio de ativos industriais (Tags), persistência de sessão e automação de publicação.

---

## 1. Gestão de Ativos (Tags) e Metrologia

### 🚀 Backend
- [x] **Domínio de Tags Industriais:** Implementação de `/api/tags` para cadastro de instrumentos.
    - **Incerteza:** Inclusão do campo `std_dev` (desvio padrão) para alimentar a matriz de covariância no motor de cálculo.
- [x] **Isolamento de Proprietário:** Filtros em nível de query para garantir que um operador gerencie apenas as tags que ele cadastrou.

### 🎨 Frontend
- [x] **Módulo de Gerenciamento de Tags:** Interface CRUD intuitiva para manutenção de instrumentos e suas unidades de engenharia.
- [x] **Vínculo Visual:** Desenvolvimento de seletores no Canvas para associar correntes do grafo a tags reais persistidas no banco.

---

## 2. Persistência de Sessão e UX

### 🚀 Backend
- [x] **Refresh Token Rotation:** Implementação de renovação automática de sessão via rota `/api/auth/refresh`, garantindo segurança e fluidez no trabalho de modelagem de longa duração.

### 🎨 Frontend
- [x] **Layout Centralizado (AppShell):** Criação da estrutura de navegação persistente com sidebar para acesso rápido a Dashboard, Tags e Histórico.
- [x] **Auth Persistence:** Integração do Zustand com LocalStorage para manter o estado de login resiliente a recarregamentos acidentais da página.

---

## 3. Automação e Exportação

### 🚀 Backend
- [x] **Export Manager:** Rota `/api/reconcile/export` para conversão de históricos JSON em planilhas CSV, facilitando auditorias externas em Excel.
- [x] **CI/CD Pipelines (Gitea):** Automatização do fluxo `main.yaml` para versionamento atômico (`apps/backend/VERSION`) e push de imagens para o Docker Registry privado.

---

## 🧪 Estratégia de Validação
- [x] **Segurança:** Validação da expiração forçada de tokens e renovação via Refresh Token.
- [x] **Dados:** Teste de integridade do download de CSV, garantindo que os dados reconciliados batam com o snapshot salvo no Postgres.
- [x] **Pipeline:** Verificação da corretude das tags de imagem geradas pelo processo de build automático.
