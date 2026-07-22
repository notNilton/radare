# 06 - Estratégia da Fase 6: Otimização Heurística e Reconciliação Avançada

> **Status: [~] Em andamento** — núcleo algorítmico implementado em Go (5 pacotes, todos com
> testes passando); API/frontend/protocolo de pesquisa completo (Seção 0) ainda pendentes. Ver
> `docs/references/01-RECONCILIATION-THEORY.md`.

A Fase 6 substitui o antigo plano de multi-tenancy/SaaS, que foi descontinuado por não agregar
contribuição científica ao projeto. Em seu lugar, esta fase concentra o trabalho algorítmico que
transforma o Radare de "implementação de um método clássico" em uma plataforma de experimentação
para problemas em aberto na literatura de Data Reconciliation & Gross Error Detection (DR&GED):
pesos desconhecidos, restrições não-lineares, variação temporal, degradação de sensores e o
desenho ótimo da própria rede de instrumentação.

Cada seção abaixo referencia o autor/paper que motiva o trabalho, para manter o projeto rastreável
como base de um anteprojeto de mestrado.

---

## 0. Metodologia Científica e Protocolo de Validação

> Esta seção é normativa para **toda** a agenda de pesquisa (Fase 6 e Fase 7). Nenhum item das
> seções 1-5 abaixo, ou da Fase 7, deve ser considerado "concluído" sem passar pelos cinco pontos
> a seguir — é o que separa "feature implementada" de "resultado defensável perante uma banca ou
> revisor".

### 0.1 Hipóteses formais (não apenas features)

Cada entrega precisa nascer de uma pergunta testável, não de uma lista de tarefas. Exemplos a
formalizar antes de começar a implementação de cada item:

- **H1 (Solver Genético, Seção 1):** o GA produz solução estatisticamente equivalente ao solver de
  Lagrange quando a covariância é conhecida, e superior quando a covariância é mal-especificada ou
  desconhecida (métrica: erro quadrático ponderado final, comparado via teste pareado).
- **H2 (Detecção de Drift, Seção 4):** o detector CUSUM/EWMA identifica degradação gradual de sensor
  com menor tempo médio de detecção do que o Teste Global (χ²) instantâneo da Fase 4, para a mesma
  taxa de falsos positivos.
- **H3 (Detecção Híbrida, Fase 7 Seção 4):** o classificador híbrido (estatística + ML) melhora
  F1-score na detecção de erro grosseiro em relação ao Teste Global/GLR isolado, sob as classes de
  falha definidas no motor de fuzzing (Fase 7 Seção 1).

Cada nova frente de trabalho deve declarar sua própria hipótese nesse formato antes de virar código.

### 0.2 Baselines robustos da literatura (não só o solver interno)

Comparar o GA e o classificador híbrido apenas contra o Lagrange multiplier atual é insuficiente —
um revisor vai perguntar "por que não comparou com os métodos robustos padrão do campo". É
obrigatório incluir como baseline, antes de reivindicar qualquer ganho:

- [x] **M-estimador de Huber** e **Fair function** — implementados em
      `internal/reconciliation/robust/robust.go` via IRLS reaproveitando o solver de Lagrange
      existente; testado em `robust_test.go` (down-weighting do sensor mais inconsistente,
      verificado de forma auto-consistente contra a baseline OLS).
- [ ] **Modified Iterative Measurement Test (MIMT)** — alternativa clássica ao Teste Global para
      identificação serial de outliers. Não implementado.
- [ ] O GLR (Narasimhan & Mah, 1987), já referenciado na Fase 7, precisa estar implementado como
      baseline funcional, não apenas citado. Não implementado.

### 0.3 Dataset real ou benchmark público (não só os Exemplos 1-4)

Os 4 exemplos sintéticos do Radare provam que o código roda, não que os métodos generalizam. Antes
de reportar qualquer resultado como contribuição:

- [ ] Buscar acesso a dados reais de planta (mesmo anonimizados/normalizados) via contato acadêmico
      ou industrial.
- [ ] Na ausência de dado real, adotar um benchmark público reconhecido pela comunidade — ex.
      **DAMADICS** (benchmark clássico de detecção de falhas em atuadores/sensores industriais) —
      em vez de depender só de topologias autorais.
- [ ] Os Exemplos 1-4 continuam válidos como *smoke test* de regressão, mas não como evidência de
      generalização em nenhuma publicação/anteprojeto.

### 0.4 Protocolo de significância estatística

Toda comparação numérica (Seção 0.1/0.2) precisa reportar, não só o valor médio:

- [ ] Número de repetições fixado a priori (ex. 30 rodadas independentes por configuração).
- [ ] Teste estatístico apropriado (t-test pareado se normalidade for razoável; Wilcoxon
      signed-rank caso contrário) — decisão registrada, não escolhida post-hoc.
- [ ] Intervalo de confiança (95%) e tamanho de efeito (Cohen's d ou equivalente), não apenas p-valor.

### 0.5 Reprodutibilidade experimental

- [ ] Seeds fixas e documentadas para GA, Monte Carlo (Fase 7) e geração de dados fuzzados.
- [ ] Configuração de cada experimento versionada (arquivo de config com hash/tag de commit
      associado ao resultado publicado).
- [ ] Convenção de diretório `experiments/<data>-<descricao>/` com config + output + seed, para que
      qualquer resultado citado no anteprojeto seja re-executável por um terceiro.

### 0.6 Validação fora da distribuição de treino (específico ao classificador de ML, Fase 7 Seção 4)

- [ ] Split treino/teste/validação com k-fold cross-validation, nunca avaliar no mesmo conjunto usado
      para ajustar hiperparâmetros.
- [ ] Testar o classificador treinado no motor de fuzzing gaussiano (Fase 7 Seção 1) contra ruído
      gerado com distribuições diferentes das usadas no treino (ex. treinar com gaussiano, testar com
      ruído impulsivo) — sem isso, qualquer ganho reportado é suspeito de overfitting ao próprio
      gerador sintético.

---

## 1. Solver Genético (GA) para Pesos Desconhecidos

**Motivação:** o solver atual (`internal/reconciliation/reconciliation.go`) resolve o problema via
multiplicadores de Lagrange assumindo matriz de covariância conhecida. Quando a variância dos
sensores é desconhecida ou não-gaussiana, essa premissa falha — um gap identificado na literatura
(Romagnoli & Sanchez, 2000).

### 🚀 Backend
- [x] **Novo pacote `internal/reconciliation/heuristics/`** (`genetic.go`):
    - [x] Cromossomo real-coded (vetor de valores reconciliados, não pesos — a busca varre o espaço de
          soluções diretamente, com `searchRange` derivado da tolerância de cada medição).
    - [x] Função de fitness = erro quadrático ponderado + penalidade por violação de balanço
          (`ConstraintPenalty`) + penalidade por violação de bounds (`BoundsPenalty`, ver Seção 2).
    - [x] Seleção por torneio, crossover aritmético e mutação gaussiana, configuráveis via `Config`
          (incluindo `Seed` para reprodutibilidade, per Seção 0.5).
- [x] **Harness comparativo** (`benchmark.go`, `Compare()`): roda GA e Lagrange sobre o mesmo problema
      e reporta `MaxAbsoluteDifference` — valida H1 (Seção 0.1). Testado com o Exemplo 2 (mesmo fixture
      de `reconciliation_test.go`); **os Exemplos 1, 3 e 4 ainda não foram rodados pelo harness**.
    - [ ] Métrica de tempo de execução (wall-clock) ainda não instrumentada — só gerações/convergência.
- [ ] **Rota de API:** `POST /api/reconcile/heuristic` — não implementada.

> **Baseline robusto adicional:** ver `internal/reconciliation/robust/` (Huber/Fair via IRLS),
> requisito da Seção 0.2 — necessário para qualquer alegação de que o GA "supera" métodos existentes.

### 🎨 Frontend
- [ ] Gráfico de convergência do GA (fitness por geração) na tela de resultado.
- [ ] Toggle "Solver: Lagrange | Genético" na execução de reconciliação.

---

## 2. Constraint Programming — Restrições de Desigualdade

**Motivação:** o modelo atual só resolve igualdades (balanço de massa). Plantas reais têm limites
físicos (vazão mínima em válvula, capacidade máxima de tanque) que a literatura trata como
restrições de desigualdade no problema de otimização.

### 🚀 Backend
- [x] Formulação como NLP com penalidade: `heuristics.Bounds{Min, Max}` por variável, com violação
      penalizada na função de fitness do GA (`BoundsPenalty`) — resolvido pelo mesmo solver da
      Seção 1, já que o Lagrange multiplier não tem como expressar desigualdades analiticamente.
- [x] Teste (`TestSolveRespectsInequalityBounds`) força uma medição fora do limite físico (100,
      limitado a [0,50]) e valida que o GA converge para perto da fronteira factível.
- [ ] Estender o modelo de `Workspace`/grafo para permitir `min`/`max` por aresta na UI/persistência —
      não implementado (hoje os bounds só existem como parâmetro de função, não como dado salvo).
- [ ] Avaliação de QP via `gonum/optimize` como alternativa ao método de penalidade — não avaliada.

---

## 3. Reconciliação Dinâmica (Séries Temporais)

**Motivação:** todo o Radare hoje reconcilia um instante (steady-state). A extensão para regime
dinâmico é uma linha de pesquisa própria (Kim et al., 1990 — "Dynamic data reconciliation: Theory
and Terminology").

### 🚀 Backend
- [x] Filtro implementado em `internal/reconciliation/dynamic/dynamic.go`: EWMA recursivo sobre a
      série de soluções steady-state (`Reconcile()` roda o solver de Lagrange em cada snapshot e
      combina com a memória via `Config.Lambda`). **Simplificação explícita e documentada no
      próprio pacote**: não é um filtro de Kalman completo (sem covariância de processo estimada),
      é um baseline para comparar antes de investir num modelo de espaço de estados completo.
- [x] Teste (`TestReconcileSmoothingReducesNoiseVersusSteadyStateAlone`) compara variância da série
      "por snapshot" vs. "com memória temporal" sob um processo constante com ruído sintético,
      confirmando redução de ruído — ainda **não rodado contra dado real/MQTT-InfluxDB** (Fase 5),
      só contra série sintética.

### 🎨 Frontend
- [ ] Sobrepor no gráfico de tendência (Fase 4) a série reconciliada dinâmica vs. estática — não
      implementado.

---

## 4. Detecção de Drift em Sensores

**Motivação:** sensores degradam precisão ao longo do tempo sem gerar erro grosseiro pontual — algo
que o Teste Global (Qui-quadrado, Fase 4) não captura por ser um teste instantâneo.

### 🚀 Backend
- [x] Carta de controle CUSUM e EWMA implementadas em `internal/reconciliation/drift/drift.go`,
      ambas com limiar configurável (`Threshold`/`L`) e reportando o índice da amostra onde o alarme
      dispara.
- [x] Teste com drift sintético gradual (`TestCUSUMDetectsGradualDriftWithoutFalseAlarm`,
      `TestEWMADetectsGradualDriftWithoutFalseAlarm`) valida detecção sem falso alarme na fase estável
      — infraestrutura para testar H2 (Seção 0.1), mas **a comparação formal contra o Teste Global
      (χ²) da Fase 4 ainda não foi feita** (falta medir "tempo médio de detecção" de cada método
      lado a lado).
- [ ] Persistir `drift_score` no LogDB junto aos audit logs existentes (Fase 5) — não implementado.

---

## 5. Design Ótimo de Rede de Sensores (Redundância & Observabilidade)

**Motivação:** literatura clássica (Kelly, 1988; Bagajewicz, 2000) trata a posição dos sensores como
problema de otimização custo-benefício, não como dado fixo. O Radare hoje assume a topologia
(incluindo quais correntes têm sensor) como entrada estática.

### 🚀 Backend
- [x] Classificador de observabilidade implementado em
      `internal/reconciliation/sensornetwork/observability.go` (`Analyze()`), via eliminação
      sequencial (equação com exatamente 1 incógnita resolve; sobra vira redundância) — testado com
      topologia conhecida (splitter de 4 variáveis, 2 equações), incluindo os casos sub-instrumentado,
      totalmente observável e sobre-instrumentado.
- [x] Grau de redundância (`Report.Redundancy`) calculado no mesmo passo.
- [x] `SuggestSensors()` — recomendação gulosa de onde adicionar sensores dado um orçamento,
      maximizando redundância resultante; testado (`TestSuggestSensorsAchievesFullObservability`).
- [ ] **Ainda não validado contra os Exemplos 1-4 reais do Radare** (só contra a topologia sintética
      de teste) nem contra um grafo de `Workspace` de verdade — falta o encanamento
      grafo-do-canvas → matriz de restrições.

### 🎨 Frontend
- [ ] Overlay no Canvas mostrando "grau de redundância" por aresta (similar ao heatmap de correção
      da Fase 4) e sugestão visual de onde adicionar sensores — não implementado.

---

## 🧪 Estratégia de Testes
- [x] Testes unitários (`go test`) para os 5 pacotes novos, todos passando:
      `heuristics` (GA + harness comparativo), `robust` (IRLS Huber/Fair), `drift` (CUSUM/EWMA),
      `sensornetwork` (observabilidade/redundância) e `dynamic` (filtro temporal).
- [x] Caso de teste com restrição de desigualdade violada propositalmente (`TestSolveRespectsInequalityBounds`).
- [x] Dataset sintético com drift injetado gradualmente (`syntheticResiduals` em `drift_test.go`).
- [ ] Suite de *benchmarks* Go (`testing.B`, medição de tempo de execução) comparando Lagrange vs. GA
      — ainda não escrita, só os testes de corretude/convergência.

## 📅 Cronograma Sugerido
- [ ] **Semanas 1-2:** Solver genético + harness comparativo.
- [ ] **Semana 3:** Constraint programming (desigualdades).
- [ ] **Semana 4:** Detecção de drift (CUSUM/EWMA).
- [ ] **Semanas 5-6:** Reconciliação dinâmica + design de rede de sensores (mais exploratórias, podem virar trabalho futuro/doutorado se não couberem no prazo do mestrado).

## 📚 Referências Diretas
- Romagnoli & Sanchez (2000) — formulação da função objetivo com incerteza.
- Kim et al. (1990) — teoria de reconciliação dinâmica.
- Kelly (1988) e Bagajewicz (2000) — desenho ótimo de rede de sensores.
- Kretsovalis & Mah (1987) — observabilidade e redundância.
