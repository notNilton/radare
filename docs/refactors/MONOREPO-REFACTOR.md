# Blueprint de Infraestrutura do Monorepo Mirante

Este documento descreve como o monorepo do Mirante foi organizado para servir como arquitetura-alvo de refatoração.
Use este material como especificação para fazer outro projeto ficar o mais próximo possível desta infraestrutura, separação de responsabilidades e fluxo operacional.

O objetivo aqui não é apenas copiar pastas.
O objetivo é reproduzir:

1. a divisão física do repositório;
2. os contratos entre banco, backend, webapp e coleção de API;
3. o fluxo de desenvolvimento local;
4. o fluxo de build, versionamento, publicação e deploy.

---

## 1. Princípio central do monorepo

O Mirante organiza o sistema por responsabilidades operacionais, não por linguagem apenas.

Cada diretório de topo existe para um papel claro:

```text
apps/
  backend/      -> aplicação executável de API
  webapp/       -> aplicação executável de frontend
client-api/     -> coleção manual/testável da API HTTP
database/       -> módulo isolado de banco, migrations e seeds
docs/           -> documentação de produto, operação e guias de migração
.gitea/
  workflows/    -> pipelines CI/CD
docker-compose.yml -> orquestração local da stack
```

A regra mais importante é:

- `apps/` contém runtimes executáveis.
- `database/` contém evolução de schema e utilitário de banco.
- `client-api/` contém contrato operacional de consumo da API.
- `docs/` contém memória técnica e instruções para humanos e LLMs.

Isso evita misturar frontend, API, SQL e documentação dentro do mesmo módulo.

---

## 2. Estrutura alvo que deve ser reproduzida

Se a intenção for refatorar outro projeto para ficar "idêntico em infraestrutura", a estrutura-alvo mínima deve ser:

```text
repo-root/
├── apps/
│   ├── backend/
│   │   ├── cmd/
│   │   │   └── api/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── config/
│   │   │   ├── handlers/
│   │   │   ├── jobs/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── cache/
│   │   │   ├── money/
│   │   │   └── version/
│   │   ├── .env.example
│   │   ├── .air.toml
│   │   ├── Dockerfile
│   │   ├── VERSION
│   │   ├── go.mod
│   │   ├── go.sum
│   │   └── vendor/
│   └── webapp/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── lib/
│       │   ├── routes/
│       │   ├── main.tsx
│       │   ├── router.tsx
│       │   ├── routeTree.gen.ts
│       │   └── styles.css
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       ├── package-lock.json
│       └── tsconfig.json
├── client-api/
│   ├── Auth/
│   ├── Accounts/
│   ├── Transactions/
│   ├── ...
│   ├── environments/
│   ├── bru-project.json
│   └── opencollection.yml
├── database/
│   ├── cmd/
│   │   └── migrate/
│   │       └── main.go
│   ├── migrations/
│   ├── seeds/
│   ├── Dockerfile
│   ├── database.go
│   ├── go.mod
│   ├── go.sum
│   └── vendor/
├── docs/
│   ├── designs/
│   ├── ops/
│   ├── prompts/
│   └── refactors/
├── .gitea/
│   └── workflows/
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 3. Papel de cada bloco

## `apps/backend`

É a API HTTP executável.
No Mirante ela usa Go puro com `net/http`, `http.ServeMux`, `pgx/v5` e JWT.

Responsabilidades:

- expor endpoints HTTP;
- validar payloads;
- aplicar autenticação/autorização;
- executar queries SQL no PostgreSQL;
- disparar jobs internos agendados;
- servir como contrato principal consumido por `webapp` e `client-api`.

Não deve conter:

- migrations;
- seeds;
- documentação operacional;
- scripts de coleção de API;
- código do frontend.

## `apps/webapp`

É a SPA principal.
No Mirante ela usa React 19, Vite e TanStack Router/Query.

Responsabilidades:

- interface do usuário;
- navegação por rotas;
- autenticação no cliente;
- chamadas HTTP centralizadas para o backend;
- renderização de dashboards, CRUDs e telas de configuração.

Não deve conter:

- regras de persistência SQL;
- migrations;
- definição de infraestrutura de banco;
- handlers do backend.

## `database`

É um módulo independente voltado exclusivamente para banco.

Responsabilidades:

- guardar migrations SQL versionadas;
- guardar seeds SQL;
- expor um conector reutilizável (`database.go`);
- expor um binário/CLI de migrations (`cmd/migrate`);
- produzir uma imagem Docker focada em aplicar migrations.

Decisão importante do Mirante:

- o backend depende do módulo `database` como biblioteca para conexão;
- o ciclo de schema não fica dentro de `apps/backend`, e sim neste pacote isolado.

Isso torna o banco um domínio operacional de primeira classe dentro do monorepo.

## `client-api`

É a coleção manual da API, usada como contrato executável para teste manual, onboarding e validação.
No Mirante ela está no formato Bruno/OpenCollection.

Responsabilidades:

- documentar endpoints reais;
- permitir testes rápidos fora do frontend;
- registrar variáveis de ambiente e fluxo de autenticação;
- servir como catálogo vivo de requests por módulo.

A coleção deve espelhar a API por domínio:

```text
client-api/
  Auth/
  Accounts/
  Cards/
  Categories/
  Transactions/
  Transfers/
  Vehicles/
  Budgets/
  Settings/
  ...
```

## `docs`

É a camada de inteligência operacional e arquitetural do repositório.

Subdivisão atual:

- `docs/designs/`: decisões de produto e design.
- `docs/ops/`: incidentes, operação e troubleshooting.
- `docs/prompts/`: prompts utilitários para workflows.
- `docs/refactors/`: guias para migrar sistemas para esta arquitetura.

Em um clone estrutural desta infraestrutura, `docs/` não é opcional.
Ele faz parte da estratégia do sistema porque concentra o conhecimento necessário para manter e replicar a arquitetura.

---

## 4. Relação entre os módulos

O fluxo estrutural correto é:

```text
webapp -> backend -> database(PostgreSQL)
client-api -> backend -> database(PostgreSQL)
database/cmd/migrate -> database(PostgreSQL)
docs -> orienta humanos, CI e LLMs
```

Dependências permitidas:

- `apps/backend` pode importar `database`.
- `apps/webapp` não importa código do backend nem do database.
- `client-api` não depende do código-fonte; depende apenas dos endpoints HTTP.
- `docs` não é dependência de runtime, mas é dependência de operação.

Dependências que devem ser evitadas:

- frontend importando diretamente SQL ou schema;
- backend contendo migrations internas próprias fora de `database/`;
- coleção de API misturada dentro do frontend;
- documentação solta em diretórios de app em vez de `docs/`.

---

## 5. Backend: organização interna que deve ser imitada

O backend do Mirante segue um desenho extremamente direto:

- `cmd/api/main.go` é o entrypoint;
- `internal/config` lê ambiente;
- `internal/routes` registra rotas;
- `internal/handlers` concentra casos de uso HTTP;
- `internal/middleware` aplica autenticação;
- `internal/models` define modelos de transporte/domínio;
- `internal/jobs` executa rotinas agendadas;
- `internal/cache` guarda cache em memória;
- `internal/money` centraliza conversões monetárias;
- `internal/version` recebe versão injetada no build.

Fluxo de boot:

1. carregar `.env` quando existir;
2. carregar configuração de ambiente;
3. abrir pool PostgreSQL via módulo `database`;
4. inicializar cache;
5. subir scheduler de jobs;
6. registrar rotas em `http.ServeMux`;
7. iniciar `ListenAndServe`.

Padrões de implementação que devem ser preservados:

- roteamento com Go stdlib;
- handlers agrupados por domínio;
- sem framework pesado;
- SQL explícito;
- autenticação JWT por middleware;
- logs de request no processo principal;
- scheduler embutido no backend para rotinas periódicas.

---

## 6. Database: organização interna que deve ser imitada

O diretório `database/` é tratado como um módulo próprio em Go.

Elementos essenciais:

- `database.go`: função `Connect(dsn string)` que devolve `*pgxpool.Pool`;
- `cmd/migrate/main.go`: CLI de migrations e seeds;
- `migrations/*.sql`: versionamento de schema;
- `seeds/*.sql`: dados iniciais;
- `Dockerfile`: imagem mínima para rodar migrations.

Comandos operacionais suportados pelo CLI atual:

- `up`
- `down`
- `drop`
- `version`
- `seed`

Regras arquiteturais:

- migrations devem ser SQL puro;
- cada migration tem arquivo `.up.sql` e `.down.sql`;
- seeds são separados de migrations;
- a imagem de database existe para operacionalizar bootstrap/evolução de schema, não para hospedar o PostgreSQL.

No Mirante, o schema inicial cobre:

- usuários;
- contas;
- cartões;
- compartilhamento de contas;
- categorias;
- tags;
- transações;
- transferências;
- veículos;
- abastecimentos;
- manutenções;
- fingerprints de importação;
- budgets.

Padrões de modelagem que merecem ser replicados:

- IDs em texto com UUID gerado no banco;
- soft delete em várias entidades;
- dinheiro em `BIGINT` centavos;
- enums explícitos no PostgreSQL;
- tabelas auxiliares para relações N:N e vínculos entre eventos financeiros.

---

## 7. Webapp: organização interna que deve ser imitada

O `apps/webapp` é uma aplicação separada, com build e deploy independentes do backend.

Organização principal:

- `src/components/`: UI reutilizável;
- `src/lib/api.ts`: único cliente HTTP;
- `src/lib/auth.ts`: token local e logout;
- `src/routes/`: roteamento baseado em arquivos;
- `src/router.tsx`: `QueryClient` + router;
- `src/main.tsx`: bootstrap da aplicação.

Padrões que devem ser mantidos:

- uma camada central de API no frontend;
- token JWT armazenado no cliente;
- redirecionamento no `401`;
- Query Client configurado globalmente;
- rotas públicas agrupadas em `/auth`;
- resto do app protegido por auth guard no root.

A divisão de rotas no Mirante também espelha o domínio:

```text
wallet/
activity/
planning/
settings/
auth/
```

Isso é importante porque o frontend conversa com a mesma taxonomia de módulos presente em `client-api` e nos handlers do backend.

---

## 8. Client API: contrato executável que deve ser imitado

O diretório `client-api/` funciona como uma "documentação viva" da API.

No Mirante:

- existe um `bru-project.json`;
- existe um `opencollection.yml`;
- existe uma pasta `environments/`;
- cada endpoint fica em um arquivo YAML individual.

Padrão de organização:

- um diretório por domínio;
- um arquivo por ação HTTP;
- ambiente separado para desenvolvimento;
- script pós-resposta no login para persistir token;
- bearer token aplicado via variável de ambiente da coleção.

Exemplo do que outra LLM deve reproduzir:

1. criar pasta `client-api/`;
2. criar coleção Bruno/OpenCollection;
3. separar requests por bounded context;
4. criar ambiente `Development`;
5. garantir que `Login` salva `accessToken`;
6. fazer os demais endpoints usarem `{{accessToken}}`.

Essa pasta não substitui OpenAPI formal.
Ela complementa a operação diária com algo simples, versionado e humano.

---

## 9. Docs: organização documental que deve ser imitada

Se a intenção é deixar outro sistema com a mesma maturidade estrutural, replique também a organização documental.

Estrutura recomendada:

```text
docs/
  designs/    -> decisões funcionais, UX e modelagem
  ops/        -> runbooks, postmortems, troubleshooting
  prompts/    -> prompts ou rotinas para automação/assistentes
  refactors/  -> guias para migração de sistemas antigos
```

Regras:

- incidentes vão para `docs/ops/`;
- documentação de arquitetura vai para `docs/refactors/` ou `docs/designs/`;
- instruções operacionais recorrentes devem ser persistidas em markdown;
- documentação para LLM deve ser explícita, imperativa e baseada em estrutura alvo.

---

## 10. Fluxo de ambiente local

A stack local é orquestrada com `docker-compose.yml` na raiz.

Serviços atuais:

- `db`: PostgreSQL;
- `migrate`: imagem de migrations;
- `backend`: API;
- `webapp`: frontend servido por nginx.

Fluxo local esperado:

1. subir `db`;
2. configurar variáveis de ambiente;
3. aplicar migrations;
4. iniciar backend;
5. iniciar webapp;
6. usar `client-api` para smoke tests.

A raiz do monorepo contém variáveis compartilhadas de ambiente, enquanto `apps/backend/.env.example` documenta o app de backend.

Separação importante:

- a infraestrutura local vive na raiz;
- a configuração específica do app vive perto do app;
- o banco não é definido dentro do backend.

---

## 11. Build e imagens Docker

Cada runtime relevante tem seu próprio `Dockerfile`.

### Backend

Imagem mínima baseada em Alpine.
Ela recebe um binário previamente compilado e apenas o executa.

Isso implica o seguinte padrão de pipeline:

1. compilar binário antes;
2. copiar binário para a imagem;
3. não compilar dentro do container final.

### Database

A imagem do `database/` empacota:

- binário `migrate`;
- migrations;
- seeds.

Ela existe para rodar evolução de schema de forma reproduzível.

### Webapp

O frontend gera `dist/` antes e a imagem final usa nginx para servir assets estáticos.

Padrão de build a ser copiado:

1. buildar frontend fora da imagem final;
2. copiar `dist/` para nginx;
3. manter o container final simples.

---

## 12. CI/CD que deve ser reproduzido

O repositório possui pipelines em `.gitea/workflows/`.

Dois fluxos existem hoje:

## `ondev.yml`

Função:

- validar a branch `development` sem publicar imagens.

Etapas principais:

- clonar repositório;
- compilar backend com `-mod=vendor`;
- instalar dependências do webapp e buildar;
- validar `docker-compose.yml`.

## `onmain.yml`

Função:

- versionar automaticamente e publicar imagens no registry.

Etapas principais:

1. incrementar versão do backend em `apps/backend/VERSION`;
2. incrementar versão do frontend em `apps/webapp/package.json`;
3. commitar e criar tags;
4. buildar e publicar imagem do backend;
5. buildar e publicar imagem do database;
6. buildar e publicar imagem do webapp.

Padrões que outra LLM deve copiar:

- pipeline de validação separado de pipeline de release;
- versionamento por app;
- imagens independentes por componente;
- build do backend com `vendor`;
- build do webapp separado do backend;
- database tratado como artefato publicável.

---

## 13. Gestão de dependências

O backend e o módulo `database` usam `vendor/`.

Motivações:

- builds reprodutíveis;
- menor dependência de rede no CI;
- previsibilidade em ambientes fechados.

Padrão a replicar:

- cada módulo Go tem seu próprio `go.mod`;
- `apps/backend` referencia `database` via `replace`;
- cada módulo mantém `vendor/` próprio;
- o CI compila com `GOWORK=off` e `-mod=vendor`.

O frontend permanece com seu próprio `package.json` dentro de `apps/webapp`.

Conclusão importante:

- este monorepo não centraliza dependências em um único workspace JavaScript;
- ele centraliza a infraestrutura e o versionamento, mas mantém cada runtime com autonomia.

---

## 14. Convenções de domínio

Um ponto forte do Mirante é o alinhamento entre todas as camadas.

Os mesmos domínios aparecem em:

- handlers do backend;
- rotas do frontend;
- pasta `client-api`;
- modelagem do banco.

Exemplos:

- `accounts`
- `cards`
- `transactions`
- `transfers`
- `budgets`
- `vehicles`
- `settings`
- `dashboard`

Ao refatorar outro projeto, preserve esse espelhamento.
Ele reduz ambiguidade e facilita onboarding humano e automatizado.

---

## 15. Regras de replicação para outra LLM

Se outra LLM for refatorar um projeto legado para esta infraestrutura, ela deve seguir estas regras em ordem:

1. criar a estrutura física de diretórios igual à deste blueprint;
2. mover todo código executável para `apps/backend` e `apps/webapp`;
3. extrair schema, migrations e seeds para `database/`;
4. criar CLI de migrations em `database/cmd/migrate`;
5. criar coleção `client-api/` por domínio;
6. criar `docs/` com separação por tipo de conhecimento;
7. criar `docker-compose.yml` na raiz para orquestração local;
8. criar Dockerfiles independentes para backend, database e webapp;
9. criar workflows de CI para validação e release;
10. alinhar nomes de módulos entre banco, API, frontend e coleção.

Regras adicionais:

- evitar acoplamento entre frontend e backend fora de HTTP;
- evitar migrations dentro de `apps/backend`;
- evitar documentação crítica fora de `docs/`;
- evitar pipelines únicos que façam tudo sem separação de contexto;
- evitar estrutura genérica tipo `src/shared/everything`.

---

## 16. Checklist de conformidade

Considere que outro projeto ficou equivalente quando atender a tudo abaixo:

- existe `apps/backend` como runtime independente;
- existe `apps/webapp` como runtime independente;
- existe `database` com migrations, seeds e CLI próprios;
- existe `client-api` organizado por domínio;
- existe `docs` com subpastas operacionais e arquiteturais;
- existe `docker-compose.yml` na raiz;
- existe um `Dockerfile` por componente implantável;
- backend e database têm módulos Go separados;
- frontend consome backend por cliente HTTP centralizado;
- CI valida `development` e publica a partir de `main`;
- versionamento de backend e webapp ocorre separadamente;
- o banco é um domínio operacional explícito dentro do repositório.

---

## 17. Resumo executivo para outra LLM

Refatore o projeto-alvo para este formato mental:

- o monorepo tem três produtos técnicos centrais: `backend`, `webapp`, `database`;
- `client-api` é o catálogo executável dos endpoints;
- `docs` é parte da infraestrutura de manutenção, não um extra;
- a raiz orquestra ambiente local e CI/CD;
- cada peça builda e versiona com relativa independência;
- os domínios de negócio precisam manter o mesmo nome em todas as camadas.

Se precisar escolher entre "copiar código" e "copiar organização", priorize copiar a organização.
É essa organização que torna o sistema replicável, operável e fácil de migrar por humanos ou por LLMs.
