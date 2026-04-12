# Post: Detecção de Erros Brutos com Teste de Qui-Quadrado

**Título Sugerido:** Reconciliação de Dados: Como saber se o seu balanço de massa é estatisticamente válido?

---

**Conteúdo:**

No fechamento de balanços de massa e energia industriais, o maior perigo não é a incerteza estatística (ruído), mas o **Erro Bruto** (vazamentos reais ou sensores travados). 

Se eu aplico uma reconciliação convencional em um sistema com um sensor defeituoso, o algoritmo irá "espalhar" esse erro por todas as outras variáveis para forçar o fechamento do balanço, gerando dados reconciliados que parecem perfeitos, mas são fisicamente falsos.

No meu projeto **Radare**, resolvi isso implementando o **Global Test ($\chi^2$)** na Fase 4. Abaixo, a anatomia técnica da minha solução:

### 1. O Problema Inicial
Como distinguir entre o ruído normal de medição e uma falha catastrófica no modelo ou no instrumento? Sem um critério de rejeição, a reconciliação é cega.

### 2. A Solução Matemática
Implementei o cálculo do resíduo ponderado ($h$) através da função objetivo:
$h = r^T (V)^{-1} r$

Onde:
- $r$ é o vetor de resíduos (diferença entre medido e reconciliado).
- $V$ é a matriz de covariância das incertezas dos sensores.

Este valor $h$ segue uma distribuição de Qui-quadrado. Se $h > \chi^2_{critico}$ (baseado nos graus de liberdade do sistema), a reconciliação é marcada como **Estatisticamente Inválida**.

### 3. Identificação de Outliers
Não basta saber que há um erro; é preciso localizá-lo. Implementei a análise de contribuição individual para o erro global. No frontend (React Flow), isso é visualizado através de:
- **Heatmaps:** Arestas com maior correção percentual são destacadas em gradientes de vermelho.
- **Outlier Detection:** O sistema aponta automaticamente a tag que mais penaliza o teste estatístico.

### 4. Implementação Técnica
- **Backend (Go):** Processamento matricial otimizado para calcular o teste de hipótese em tempo real após cada convergência do solver de Lagrange.
- **Frontend (TS/React):** Feedback imediato no Canvas através de badges de validade e alertas de confiança.

**Conclusão:** 
A reconciliação de dados sem validação estatística é apenas um "maquiador de dados". Com o Global Test, transformei o Radare em uma ferramenta de diagnóstico de integridade de ativos.

#EngenhariaDeProcesso #DataReconciliation #Golang #IndustrialAutomation #QuiQuadrado
