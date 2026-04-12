# 04 - Estratégia da Fase 4: Inteligência e Persistência

> **Status: [x] Concluída**



A Fase 4 transforma o **Radare** de uma ferramenta de cálculo volátil em um sistema de gestão de ativos industriais, permitindo a persistência de modelos de processo e detecção estatística de falhas graves.

---

## 1. Persistência de Grafos (Topologias)

### 🚀 Backend
- [x] **Novo Modelo `Workspace`:**
    - [x] `id`, `name`, `description`, `owner_id`.
    - [x] `data` (JSONB): Armazenará o estado completo do React Flow (nós, arestas, posições, zoom).
- [x] **Novas Rotas:**
    - [x] `GET /api/workspaces`: Lista layouts salvos.
    - [x] `POST /api/workspaces`: Salva ou atualiza um layout.
    - [x] `GET /api/workspaces/:id`: Carrega um layout específico.
    - [x] `DELETE /api/workspaces/:id`: Remove um layout.

### 🎨 Frontend
- [x] **Interface de Gestão:**
    - [x] Botões "Salvar Layout" e "Carregar" na barra de ferramentas do Canvas.
    - [x] Modal para nomear e descrever o Workspace antes de salvar.
- [x] **Integração React Flow:**
    - [x] Lógica para serializar `nodes` e `edges` antes de enviar ao backend.
    - [x] Lógica para restaurar o estado ao carregar.
- [x] **Layouts de exemplo:**
    - [x] Botões na barra superior para carregar Exemplo 1, Exemplo 2, Exemplo 3 e Exemplo 4.
    - [x] Exemplo 2 e Exemplo 3 alinhados aos valores e matrizes do material de reconciliação.
    - [x] Exemplo 4 baseado na topologia comercial/Sigmafine com 13 correntes e 8 nodos de balanço.

---

## 2. Detecção de Erros Brutos (Global Test)

### 🚀 Backend
- [x] **Cálculo Qui-quadrado ($\chi^2$):**
    - [x] Calcular o valor de referência: $h = r^T (V)^{-1} r$ onde $r$ é o resíduo e $V$ a covariância.
    - [x] Comparar com a tabela de distribuição baseada nos graus de liberdade (número de restrições).
- [x] **Resposta da API:**
    - [x] Incluir campo `statistical_validity` (boolean) e `confidence_score` na resposta do `/reconcile`.
    - [x] Identificar a tag com maior contribuição para o erro (outlier).

### 🎨 Frontend
- [x] **Indicador de Qualidade:**
    - [x] Badge visual no Canvas ou barra lateral indicando se a reconciliação é "Estatisticamente Válida" ou "Suspeita de Erro Bruto".
- [x] **Heatmaps:**
    - [x] Colorir as arestas (edges) com tons de vermelho/laranja baseando-se no percentual de correção aplicada (Ex: >10% de correção = Alerta Visual).
    - [x] Destacar a corrente com maior contribuição estatística como outlier visual.
- [x] **Refinamento de UX:**
    - [x] Undo/Redo para alterações do Canvas.

---

## 3. Visualização de Tendências (Trends)

### 🎨 Frontend
- [x] **Mini-Gráfico de Tendência:**
    - [x] Ao selecionar uma aresta ou tag, exibir um gráfico (Sparkline) mostrando o histórico de `Medido` vs `Reconciliado` dos últimos 10-20 registros.
- [x] **Biblioteca:** Usar SVG local para manter o bundle leve, sem dependência extra de gráficos nesta etapa.

---

## 📅 Cronograma Sugerido

- [x] **Semana 1:** Implementação do CRUD de Workspaces (Backend + DB + UI Básica).
- [x] **Semana 2:** Lógica de Qui-quadrado no Backend e integração de Outliers.
- [x] **Semana 3:** Heatmaps de correção no Canvas e Refinamento de UX (Undo/Redo).
- [x] **Semana 4:** Gráficos de tendência e validação final.

---

## 🧪 Estratégia de Testes
- [x] **Backend:** Testes unitários para a função de cálculo do Qui-quadrado com matrizes conhecidas.
- [x] **Frontend:** Teste de integração para salvar/carregar um grafo complexo sem perda de dados.
