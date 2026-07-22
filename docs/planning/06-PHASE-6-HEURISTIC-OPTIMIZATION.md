# 06 - Estratégia da Fase 6: Otimização Heurística e Reconciliação Avançada

> **Status: [ ] Planejada** — Núcleo da agenda de pesquisa do projeto (ver `docs/references/01-RECONCILIATION-THEORY.md`).

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

- **M-estimador de Huber** e **Fair function** (estimadores robustos clássicos para reconciliação
  na presença de erro grosseiro).
- **Modified Iterative Measurement Test (MIMT)** — alternativa clássica ao Teste Global para
  identificação serial de outliers.
- O GLR (Narasimhan & Mah, 1987), já referenciado na Fase 7, precisa estar implementado como
  baseline funcional, não apenas citado.

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
- [ ] **Novo pacote `internal/reconciliation/heuristics/`:**
    - [ ] Codificar o cromossomo como vetor de pesos/incertezas por tag.
    - [ ] Função de fitness = erro quadrático ponderado + penalidade por violação de balanço.
    - [ ] Operadores de seleção (torneio), crossover (aritmético) e mutação (gaussiana) configuráveis via struct `GAConfig`.
- [ ] **Harness comparativo:**
    - [ ] Rodar GA e Lagrange sobre os mesmos `Exemplo 1-4` (já usados na Fase 4) e registrar divergência entre soluções.
    - [ ] Métrica de convergência (gerações até estabilizar) e tempo de execução.
- [ ] **Rota de API:** `POST /api/reconcile/heuristic` retornando solução + histórico de fitness por geração (para plot de convergência no frontend).

### 🎨 Frontend
- [ ] Gráfico de convergência do GA (fitness por geração) na tela de resultado.
- [ ] Toggle "Solver: Lagrange | Genético" na execução de reconciliação.

---

## 2. Constraint Programming — Restrições de Desigualdade

**Motivação:** o modelo atual só resolve igualdades (balanço de massa). Plantas reais têm limites
físicos (vazão mínima em válvula, capacidade máxima de tanque) que a literatura trata como
restrições de desigualdade no problema de otimização.

### 🚀 Backend
- [ ] Estender o modelo de `Workspace`/grafo para permitir `min`/`max` por aresta.
- [ ] Avaliar formulação como NLP com penalidade (compatível com o solver genético) vs. QP com
      biblioteca externa (`gonum/optimize` já é dependência do projeto).
- [ ] Testes com topologia que force violação de restrição (ex.: vazão negativa) e validar que o
      solver rejeita ou ajusta a solução corretamente.

---

## 3. Reconciliação Dinâmica (Séries Temporais)

**Motivação:** todo o Radare hoje reconcilia um instante (steady-state). A extensão para regime
dinâmico é uma linha de pesquisa própria (Kim et al., 1990 — "Dynamic data reconciliation: Theory
and Terminology").

### 🚀 Backend
- [ ] Modelo de filtro (ex.: Kalman ou janela deslizante ponderada) sobre o histórico de leituras
      já ingerido via MQTT/InfluxDB (Fase 5).
- [ ] Comparar reconciliação "por snapshot" (atual) vs. "com memória temporal" no mesmo dataset,
      medindo redução de ruído residual.

### 🎨 Frontend
- [ ] Sobrepor no gráfico de tendência (Fase 4) a série reconciliada dinâmica vs. estática.

---

## 4. Detecção de Drift em Sensores

**Motivação:** sensores degradam precisão ao longo do tempo sem gerar erro grosseiro pontual — algo
que o Teste Global (Qui-quadrado, Fase 4) não captura por ser um teste instantâneo.

### 🚀 Backend
- [ ] Implementar carta de controle CUSUM ou EWMA sobre o resíduo histórico por tag.
- [ ] Alerta quando o viés acumulado ultrapassar limiar configurável (por tag ou por classe de instrumento).
- [ ] Persistir `drift_score` no LogDB junto aos audit logs existentes (Fase 5).

---

## 5. Design Ótimo de Rede de Sensores (Redundância & Observabilidade)

**Motivação:** literatura clássica (Kelly, 1988; Bagajewicz, 2000) trata a posição dos sensores como
problema de otimização custo-benefício, não como dado fixo. O Radare hoje assume a topologia
(incluindo quais correntes têm sensor) como entrada estática.

### 🚀 Backend
- [ ] Classificador de observabilidade: dado um grafo, identificar quais variáveis são calculáveis
      sem sensor direto (Kretsovalis & Mah, 1987).
- [ ] Métrica de grau de redundância por nó/aresta.
- [ ] Rotina "sugestão de sensor": dado um orçamento (N sensores adicionais), recomendar as posições
      que maximizam ganho de redundância.

### 🎨 Frontend
- [ ] Overlay no Canvas mostrando "grau de redundância" por aresta (similar ao heatmap de correção
      da Fase 4) e sugestão visual de onde adicionar sensores.

---

## 🧪 Estratégia de Testes
- [ ] Suite de benchmarks Go (`testing.B`) comparando Lagrange vs. GA em tempo e qualidade de solução.
- [ ] Casos de teste com restrições de desigualdade violadas propositalmente.
- [ ] Dataset sintético com drift injetado gradualmente para validar o CUSUM/EWMA.

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
