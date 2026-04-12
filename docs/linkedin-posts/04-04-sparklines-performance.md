# Post 04/04: Gráficos SVG com Zero Dependências

**📸 Sugestão de Mídia:** Um GIF curto (screen recording) mostrando você clicando em uma tag no Radare e o mini-gráfico (Sparkline) aparecendo instantaneamente.

---

**CONTEÚDO DO POST:**

Gráficos pesados matam a experiência do usuário em dashboards de monitoramento industrial. ⚡

Ao concluir a Fase 4 do meu projeto **Radare**, precisei exibir tendências históricas de "Medido vs Reconciliado" para dezenas de tags simultaneamente. O desafio? Manter o sistema extremamente leve e responsivo, sem injetar bibliotecas de gráficos (como Highcharts ou Chart.js) que inflariam o bundle do frontend.

**A Engenharia por trás:**
Desenvolvi **Sparklines nativos em SVG** no React, com **Zero Dependências externas**.

🚀 **Normalização Local:** Cada mini-gráfico é escalonado dinamicamente (Min/Max Scaling) dentro de seu container SVG. 
🚀 **Eficiência de Dados:** O backend envia apenas os últimos 20 pontos; o frontend mapeia esses pontos para o atributo `d` de um elemento `<path>` SVG programaticamente.

Isso permite comparar visualmente o "gap" de reconciliação em uma linha de 5 kg/h com a mesma clareza de uma linha de 1.000 t/h, sem sacrificar a performance do navegador ou a renderização em dispositivos móveis.

Quais são as suas bibliotecas favoritas (ou abordagens "vanilla") para visualização de séries temporais de alta frequência? 🛠️

---

**🚀 Dicas para o Algoritmo do LinkedIn:**
1. **Vídeo:** O LinkedIn prioriza vídeos nativos (curtos) em relação a imagens estáticas. Um GIF de 5 segundos do dashboard funcionando é ouro.
2. **Hashtags:** Use poucas hashtags (3-5), como: #WebPerformance #ReactJS #IndustrialData #SoftwareDevelopment #Golang.
