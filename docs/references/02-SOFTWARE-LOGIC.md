# Referências Acadêmicas e Técnicas: Engenharia de Software e Sistemas

Este documento detalha as bases teóricas, padrões de projeto e marcos da ciência da computação que fundamentam a construção do ecossistema **Radare**. A arquitetura foi projetada para ser modular, resiliente e escalável, baseando-se em literatura técnica de alto nível.

---

## 📚 1. Livros de Referência (Top 5 Fundamentais)

Estes livros guiaram as minhas decisões sobre a estrutura do monorepo, a escolha do Go e a estratégia de persistência híbrida.

1. **Clean Architecture: A Craftsman's Guide to Software Structure and Design**
   - *Autor:* Robert C. Martin (2017).
   - *Contexto:* Fundamental para a separação de camadas do Radare. Garante que o motor de cálculo (Core) seja independente de frameworks e bancos de dados.

2. **Designing Data-Intensive Applications**
   - *Autor:* Martin Kleppmann (2017).
   - *Contexto:* O "guia definitivo" para sistemas modernos. Base para a implementação da **Dual Database Architecture** e do uso estratégico do Redis como buffer de alta frequência.

3. **Patterns of Enterprise Application Architecture**
   - *Autor:* Martin Fowler (2002).
   - *Contexto:* Definição de padrões como **Data Mapper**, **Repository** e **Unit of Work**, que utilizo para isolar a complexidade do banco de dados no backend.

4. **The Go Programming Language**
   - *Autores:* Alan A. A. Donovan & Brian W. Kernighan (2015).
   - *Contexto:* A referência para o uso idiomático do Go. Guia a implementação de concorrência segura (CSP) e o gerenciamento eficiente de memória no solver.

5. **Building Microservices: Designing Fine-Grained Systems**
   - *Autor:* Sam Newman (2015).
   - *Contexto:* Embora o Radare seja um Monorepo, os princípios de **Bounded Contexts** e isolamento de serviços descritos aqui guiam a separação entre `backend`, `webapp` e `database`.

---

## 🎓 2. Artigos e Papers de Referência (Top 10 Históricos e Técnicos)

Estes artigos documentam os paradigmas que moldam a lógica de rede, concorrência e estado do sistema.

1. **"Architectural Styles and the Design of Network-based Software Architectures"**
   - *Autor:* Roy Fielding (2000). *Dissertação de Doutorado*.
   - *Impacto:* A origem do estilo **REST**, que governa toda a comunicação entre o frontend e o backend do Radare.

2. **"The Twelve-Factor App"**
   - *Autor:* Adam Wiggins (2011).
   - *Impacto:* Os 12 princípios que aplico para garantir que o Radare seja totalmente portável e pronto para ambientes de nuvem (Cloud-Native).

3. **"Why Google Stores Billions of Lines of Code in a Single Repository"**
   - *Autores:* Rachel Potvin & Josh Levenberg (2016). *Communications of the ACM*.
   - *Impacto:* Justificativa técnica para a minha escolha pela estrutura de **Monorepo**, otimizando a atomicidade de mudanças e o compartilhamento de código.

4. **"Dynamo: Amazon’s Highly Available Key-value Store"**
   - *Autores:* Giuseppe DeCandia, et al. (2007). *SOSP*.
   - *Impacto:* Base teórica para sistemas de alta disponibilidade que influenciou o meu uso do **Redis** e estratégias de particionamento.

5. **"CAP Twelve Years Later: How the 'Rules' Have Changed"**
   - *Autor:* Eric Brewer (2012). *IEEE Computer*.
   - *Impacto:* Fundamental para a tomada de decisão sobre **Consistência vs. Disponibilidade** no banco de dados de logs industrial.

6. **"Communicating Sequential Processes (CSP)"**
   - *Autor:* C. A. R. Hoare (1978). *Communications of the ACM*.
   - *Impacto:* A base teórica das **Goroutines e Channels** do Go, que utilizo para processar cálculos matriciais em paralelo sem locks.

7. **"The Reactive Manifesto"**
   - *Autores:* Bonér, et al. (2014).
   - *Impacto:* Guia a implementação de **WebSockets** no Radare, garantindo que o dashboard seja responsivo, resiliente e orientado a mensagens.

8. **"A Pattern for Event-Based Software Architecture"**
   - *Autor:* Martin Fowler (2006).
   - *Impacto:* Base para a lógica de notificação e gatilhos de cálculo assíncronos que estou implementando.

9. **"Flux: Application Architecture for Building User Interfaces"**
   - *Autor:* Facebook Engineering.
   - *Impacto:* Influenciou a minha gestão de estado no frontend com **Zustand**, garantindo um fluxo unidirecional de dados e previsibilidade na UI.

10. **"PostgreSQL: 15 Years of Open Source"**
    - *Autores:* Bruce Momjian, et al.
    - *Impacto:* Estudos sobre a robustez do **MVCC** e eficiência de campos **JSONB**, que sustentam a persistência de topologias complexas no Radare.

---

## 🛠️ 3. Padrões de Design de Software Aplicados

- **Outbox Pattern:** Garantia de consistência entre a persistência do banco e o disparo de notificações.
- **Idempotency Pattern:** Uso de chaves únicas para garantir que a re-injeção de dados industriais não gere duplicidade.
- **Circuit Breaker:** Proteção contra falhas em fontes de dados externas (MQTT/InfluxDB) para evitar efeito cascata no backend.
