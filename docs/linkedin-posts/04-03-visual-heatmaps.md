# Post 03/04: Heatmaps Baseados em Metrologia

**📸 Sugestão de Mídia:** Um print do Canvas do Radare mostrando arestas em VERMELHO (onde $z_i > 3$) e VERDE (dentro da incerteza).

---

**CONTEÚDO DO POST:**

Parem de tentar caçar erros em tabelas de Excel com 500 linhas. Engenharia de precisão exige diagnóstico visual imediato. 🔴🟢

No meu projeto **Radare**, eu queria que o engenheiro batesse o olho no canvas e soubesse onde o balanço está "gritando" estatisticamente. Mas atenção: pintar o gráfico baseado em correção percentual absoluta é um erro conceitual básico em reconciliação de dados.

**Minha Abordagem Técnica:**
Implementei Heatmaps dinâmicos baseados no **Resíduo Normalizado ($z_i$)**:

$z_i = \frac{|y_{medido} - \hat{y}_{reconciliado}|}{\sigma_i}$

Onde $\sigma_i$ é a incerteza específica de cada instrumento (incerteza do sensor Coriolis vs Placa de Orifício).

✅ **O resultado:** A aresta só fica vermelha se $z_i > 3$ (limite estatístico de 99% de confiança). 

Isso separa o que é variação normal do que é um outlier real, independentemente da escala de vazão da linha. É a metrologia guiando a interface do usuário e reduzindo a fadiga cognitiva.

**Pergunta aos engenheiros de processo:** Vocês preferem heatmaps dinâmicos no canvas ou ainda confiam mais nos relatórios tabulares clássicos para o dia a dia?

---

**🚀 Dicas para o Algoritmo do LinkedIn:**
1. **Visual:** Posts com contrastes de cores (Verde/Vermelho) no print tendem a ter maior taxa de clique no feed.
2. **Escrita:** Use as quebras de linha como eu fiz acima para facilitar a leitura no celular (que representa 80% do tráfego do LinkedIn).
