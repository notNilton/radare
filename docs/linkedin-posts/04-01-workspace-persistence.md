# Post 01/04: Persistência de Topologias de Processo

**📸 Sugestão de Mídia:** Print do Canvas do Radare com uma planta complexa (ex: Exemplo 4 com 13 correntes).

---

**CONTEÚDO DO POST:**

Perder horas de trabalho por causa de um "refresh" no navegador? No setor industrial, isso é inaceitável. 📉

Ao desenvolver o meu projeto **Radare**, foquei em transformar uma ferramenta de cálculo volátil em um sistema de gestão de ativos resiliente. O maior desafio? Persistir a topologia complexa de uma planta (nós, conexões, tags) sem engessar o sistema ou quebrar o banco de dados a cada nova funcionalidade do canvas.

**A Minha Solução Técnica:**
Em vez de mapear cada nó e aresta em tabelas relacionais rígidas — o que geraria um overhead imenso de queries e migrações — optei por uma abordagem híbrida:

🛠️ **JSONB no PostgreSQL:** Utilizo para persistir o estado completo de layout do React Flow (posições, tipos de nós e metadados de visualização). 
🛠️ **Integridade Referencial:** Apesar da flexibilidade do JSONB, os IDs dos sensores dentro do objeto apontam para a minha tabela mestre de Tags. 

Isso me dá o melhor dos dois mundos: o "Schema-on-Read" necessário para a agilidade da interface, mantendo a consistência relacional exigida pela engenharia de dados.

No próximo post da série, vou mostrar como uso essa base para rodar testes estatísticos de hipótese em tempo real.

**Pergunta para os colegas de dados:** Como vocês equilibram flexibilidade de UI com integridade referencial em sistemas de grafos complexos?

---

**🚀 Dicas para o Algoritmo do LinkedIn:**
1. **Horário:** Poste entre 08:00 e 10:00 da manhã.
2. **Links:** NÃO coloque o link do GitHub no corpo do post. Poste o texto puro e coloque o link no PRIMEIRO COMENTÁRIO.
3. **Engajamento:** Responda todos os comentários nas primeiras 2 horas.
