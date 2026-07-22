# 07 - Estratégia da Fase 7: Stress Testing, Robustez e Validação Estatística

> **Status: [ ] Planejada** — Fundamenta a validação empírica exigida para publicação/anteprojeto (ver `docs/references/01-RECONCILIATION-THEORY.md`).

A Fase 7 substitui o antigo plano de Edge Computing e Digital Twins/Alta Disponibilidade, que foram
descontinuados por serem escopo de produto/infraestrutura sem contribuição científica. Em seu
lugar, esta fase constrói a metodologia de validação que os papers clássicos da área usam para
comparar algoritmos de detecção de erro grosseiro (Tamhane & Mah, 1985; Narasimhan & Mah, 1987) —
injeção de falhas sintéticas, verificação de plausibilidade física e quantificação de incerteza.
Sem essa camada, qualquer resultado de reconciliação apresentado (inclusive na Fase 6) não tem como
ser defendido estatisticamente perante uma banca ou revisor.

> **Metodologia:** esta fase segue o protocolo definido na Seção 0 de
> `06-PHASE-6-HEURISTIC-OPTIMIZATION.md` (hipóteses formais, baselines robustos, dataset/benchmark
> real, significância estatística e reprodutibilidade). A Seção 4 abaixo (Detecção Híbrida) está
> sujeita adicionalmente ao item 0.6 (validação fora da distribuição de treino).

---

## 1. Motor de Data Fuzzing (Injeção de Erros Sintéticos)

**Motivação:** para validar detecção de erro grosseiro é preciso saber o "gabarito" (onde o erro foi
injetado) e comparar contra o que o algoritmo detecta — a mesma metodologia usada desde Tamhane &
Mah (1985).

### 🚀 Backend
- [ ] Novo pacote `internal/reconciliation/fuzzing/`:
    - [ ] Injeção de **bias** (erro sistemático constante) por tag.
    - [ ] Injeção de **drift** (erro crescente ao longo do tempo) — reaproveita o gerador de séries da Fase 6, item 4.
    - [ ] Injeção de **sensor travado** (valor constante/stuck) e **ruído inflacionado** (variância maior que a declarada).
- [ ] Gerador de dataset com "ground truth" (JSON com qual tag/instante recebeu qual tipo de erro), versionado para reprodutibilidade dos experimentos.
- [ ] CLI (`cmd/fuzz/main.go`) para gerar N datasets de teste a partir de uma topologia/Workspace existente.

---

## 2. Sanity Checker Termodinâmico

**Motivação:** um solver pode convergir para uma solução matematicamente ótima mas fisicamente
impossível (ex.: massa negativa, temperatura abaixo do zero absoluto). Nenhuma camada do Radare hoje
valida isso.

### 🚀 Backend
- [ ] Validador de limites físicos por tipo de tag (`flow >= 0`, `temperature >= -273.15`, etc.), configurável por unidade de medida.
- [ ] Checagem de consistência de balanço de energia quando aplicável (não só massa), como segunda camada de validação além do Teste Global (Qui-quadrado, Fase 4).
- [ ] Resposta de API deve reportar `physically_valid: bool` junto ao `statistical_validity` já existente.

---

## 3. Simulações Monte Carlo (Propagação de Incerteza)

**Motivação:** o Radare reporta um valor reconciliado pontual. A literatura de metrologia (ISO GUM,
já referenciado em `docs/references/01-RECONCILIATION-THEORY.md`) exige intervalo de confiança, não
apenas ponto estimado.

### 🚀 Backend
- [ ] Rodar a reconciliação N vezes perturbando as medições de entrada dentro da incerteza declarada de cada sensor (distribuição gaussiana por padrão, configurável).
- [ ] Calcular intervalo de confiança (ex.: 95%) por variável reconciliada a partir da distribuição de resultados.
- [ ] Expor tempo de execução vs. N simulações (trade-off custo computacional x precisão do intervalo), relevante para a seção de resultados de um paper.

### 🎨 Frontend
- [ ] Exibir intervalo de confiança (não só valor pontual) nos resultados e no gráfico de tendência.

---

## 4. Detecção Híbrida de Erro Grosseiro (Estatística + ML)

**Motivação:** esta é a contribuição com maior potencial de originalidade do projeto — combinar o
teste estatístico clássico (Qui-quadrado / GLR, já implementado na Fase 4) com um classificador
treinado sobre os datasets sintéticos da seção 1, e comparar as duas abordagens de forma rigorosa.

### 🚀 Backend
- [ ] Extrair features do resíduo (magnitude, persistência, correlação entre tags vizinhas no grafo) por janela de tempo.
- [ ] Treinar classificador simples (ex.: regressão logística ou árvore de decisão) sobre os dados fuzzados com ground truth da seção 1.
- [ ] Rota de comparação: para o mesmo dataset, retornar veredito do Teste Global clássico, do GLR (se implementado) e do classificador, lado a lado.

---

## 5. Framework de Benchmarking (Precisão/Recall entre Métodos)

**Motivação:** é a peça que transforma as seções 1-4 em resultado apresentável — sem isso, "eu
implementei um detector híbrido" não é uma alegação verificável.

### 🚀 Backend
- [ ] Rodar cada método de detecção (Global Test, GLR, ML) contra os datasets com ground truth e calcular precisão, recall, F1 e taxa de falso positivo.
- [ ] Exportar relatório comparativo (reaproveita o gerador de PDF da Fase 5) com tabelas e gráficos prontos para anexar a um artigo/anteprojeto.
- [ ] Versionar os resultados de benchmark (por commit/config) para permitir comparação histórica conforme os algoritmos evoluem.

---

## 🧪 Estratégia de Testes
- [ ] Testes de regressão garantindo que o motor de fuzzing produz exatamente o erro declarado (assert sobre o ground truth gerado).
- [ ] Testes de sanidade com valores fisicamente impossíveis conhecidos (fixtures) para validar o Sanity Checker.
- [ ] Teste de carga do Monte Carlo (N grande) para garantir que o tempo de execução escala de forma previsível.

## 📅 Cronograma Sugerido
- [ ] **Semana 1:** Motor de Data Fuzzing + geração de ground truth.
- [ ] **Semana 2:** Sanity Checker termodinâmico.
- [ ] **Semana 3:** Monte Carlo + intervalo de confiança.
- [ ] **Semanas 4-5:** Classificador híbrido + framework de benchmarking (o par que mais importa para uma publicação).

## 📚 Referências Diretas
- Tamhane & Mah (1985) e Narasimhan & Mah (1987) — metodologia clássica de validação por injeção de erro.
- ISO/IEC Guide 98-3 (GUM) — propagação de incerteza de medição.
- Jiang et al. (2014) — survey comparando métodos lineares/não-lineares, referência para o framework de benchmarking.
