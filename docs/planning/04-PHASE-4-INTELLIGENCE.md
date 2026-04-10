# Planejamento da Fase 4: Inteligência Operacional e Persistência

A Fase 4 transforma o **Radare** de uma ferramenta de cálculo volátil em um sistema de gestão de ativos industriais, permitindo a persistência de modelos de processo e detecção estatística de falhas graves.

---

## 1. Persistência de Grafos (Topologias)

### 🚀 Backend
- **Novo Modelo `Workspace`:**
    - `id`, `name`, `description`, `owner_id`.
    - `data` (JSONB): Armazenará o estado completo do React Flow (nós, arestas, posições, zoom).
- **Novas Rotas:**
    - `GET /api/workspaces`: Lista layouts salvos.
    - `POST /api/workspaces`: Salva ou atualiza um layout.
    - `GET /api/workspaces/:id`: Carrega um layout específico.
    - `DELETE /api/workspaces/:id`: Remove um layout.

### 🎨 Frontend
- **Interface de Gestão:**
    - Botões "Salvar Layout" e "Carregar" na barra de ferramentas do Canvas.
    - Modal para nomear e descrever o Workspace antes de salvar.
- **Integração React Flow:**
    - Lógica para serializar `nodes` e `edges` antes de enviar ao backend.
    - Lógica para restaurar o estado ao carregar.

---

## 2. Detecção de Erros Brutos (Global Test)

### 🚀 Backend
- **Cálculo Qui-quadrado ($\chi^2$):**
    - Calcular o valor de referência: $h = r^T (V)^{-1} r$ onde $r$ é o resíduo e $V$ a covariância.
    - Comparar com a tabela de distribuição baseada nos graus de liberdade (número de restrições).
- **Resposta da API:**
    - Incluir campo `statistical_validity` (boolean) e `confidence_score` na resposta do `/reconcile`.
    - Identificar a tag com maior contribuição para o erro (outlier).

### 🎨 Frontend
- **Indicador de Qualidade:**
    - Badge visual no Canvas ou barra lateral indicando se a reconciliação é "Estatisticamente Válida" ou "Suspeita de Erro Bruto".
- **Heatmaps:**
    - Colorir as arestas (edges) com tons de vermelho/laranja baseando-se no percentual de correção aplicada (Ex: >10% de correção = Alerta Visual).

---

## 3. Visualização de Tendências (Trends)

### 🎨 Frontend
- **Mini-Gráfico de Tendência:**
    - Ao selecionar uma aresta ou tag, exibir um gráfico (Sparkline) mostrando o histórico de `Medido` vs `Reconciliado` dos últimos 10-20 registros.
- **Biblioteca:** Utilizar `Recharts` ou `Chart.js` (escolher a mais leve).

---

## 📅 Cronograma Sugerido

1. **Semana 1:** Implementação do CRUD de Workspaces (Backend + DB + UI Básica).
2. **Semana 2:** Lógica de Qui-quadrado no Backend e integração de Outliers.
3. **Semana 3:** Heatmaps de correção no Canvas e Refinamento de UX (Undo/Redo).
4. **Semana 4:** Gráficos de tendência e validação final.

---

## 🧪 Estratégia de Testes
- **Backend:** Testes unitários para a função de cálculo do Qui-quadrado com matrizes conhecidas.
- **Frontend:** Teste de integração para salvar/carregar um grafo complexo sem perda de dados.
