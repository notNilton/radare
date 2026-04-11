# 01 - Estratégia da Fase 1: Arquitetura Monorepo

> **Status: [x] Implementada**



Este documento descreve como o monorepo do Mirante foi organizado para servir como arquitetura-alvo de refatoração.
Use este material como especificação para fazer outro projeto ficar o mais próximo possível desta infraestrutura, separação de responsabilidades e fluxo operacional.

O objetivo aqui não é apenas copiar pastas.
O objetivo é reproduzir:

- [x] a divisão física do repositório;
- [x] os contratos entre banco, backend, webapp e coleção de API;
- [x] o fluxo de desenvolvimento local;
- [x] o fluxo de build, versionamento, publicação e deploy.

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

- [x] `apps/` contém runtimes executáveis.
- [x] `database/` contém evolução de schema e utilitário de banco.
- [x] `client-api/` contém contrato operacional de consumo da API.
- [x] `docs/` contém memória técnica e instruções para humanos e LLMs.

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

- [x] expor endpoints HTTP;
- [x] validar payloads;
- [x] aplicar autenticação/autorização;
- [x] executar queries SQL no PostgreSQL;
- [x] disparar jobs internos agendados;
- [x] servir como contrato principal consumido por `webapp` e `client-api`.

Não deve conter:

- [x] migrations;
- [x] seeds;
- [x] documentação operacional;
- [x] scripts de coleção de API;
- [x] código do frontend.

## `apps/webapp`

É a SPA principal.
No Mirante ela usa React 19, Vite e TanStack Router/Query.

Responsabilidades:

- [x] interface do usuário;
- [x] navegação por rotas;
- [x] autenticação no cliente;
- [x] chamadas HTTP centralizadas para o backend;
- [x] renderização de dashboards, CRUDs e telas de configuração.

Não deve conter:

- [x] regras de persistência SQL;
- [x] migrations;
- [x] definição de infraestrutura de banco;
- [x] handlers do backend.

## `database`

É um módulo independente voltado exclusivamente para banco.

Responsabilidades:

- [x] guardar migrations SQL versionadas;
- [x] guardar seeds SQL;
- [x] expor um conector reutilizável (`database.go`);
- [x] expor um binário/CLI de migrations (`cmd/migrate`);
- [x] produzir uma imagem Docker focada em aplicar migrations.

Decisão importante do Mirante:

- [x] o backend depende do módulo `database` como biblioteca para conexão;
- [x] o ciclo de schema não fica dentro de `apps/backend`, e sim neste pacote isolado.

Isso torna o banco um domínio operacional de primeira classe dentro do monorepo.

## `client-api`

É a coleção manual da API, usada como contrato executável para teste manual, onboarding e validação.
No Mirante ela está no formato Bruno/OpenCollection.

Responsabilidades:

- [x] documentar endpoints reais;
- [x] permitir testes rápidos fora do frontend;
- [x] registrar variáveis de ambiente e fluxo de autenticação;
- [x] servir como catálogo vivo de requests por módulo.

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

- [x] `docs/designs/`: decisões de produto e design.
- [x] `docs/ops/`: incidentes, operação e troubleshooting.
- [x] `docs/prompts/`: prompts utilitários para workflows.
- [x] `docs/refactors/`: guias para migrar sistemas para esta arquitetura.

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

- [x] `apps/backend` pode importar `database`.
- [x] `apps/webapp` não importa código do backend nem do database.
- [x] `client-api` não depende do código-fonte; depende apenas dos endpoints HTTP.
- [x] `docs` não é dependência de runtime, mas é dependência de operação.

Dependências que devem ser evitadas:

- [x] frontend importando diretamente SQL ou schema;
- [x] backend contendo migrations internas próprias fora de `database/`;
- [x] coleção de API misturada dentro do frontend;
- [x] documentação solta em diretórios de app em vez de `docs/`.

---

## 5. Backend: organização interna que deve ser imitada

O backend do Mirante segue um desenho extremamente direto:

- [x] `cmd/api/main.go` é o entrypoint;
- [x] `internal/config` lê ambiente;
- [x] `internal/routes` registra rotas;
- [x] `internal/handlers` concentra casos de uso HTTP;
- [x] `internal/middleware` aplica autenticação;
- [x] `internal/models` define modelos de transporte/domínio;
- [x] `internal/jobs` executa rotinas agendadas;
- [x] `internal/cache` guarda cache em memória;
- [x] `internal/money` centraliza conversões monetárias;
- [x] `internal/version` recebe versão injetada no build.

Fluxo de boot:

- [x] carregar `.env` quando existir;
- [x] carregar configuração de ambiente;
- [x] abrir pool PostgreSQL via módulo `database`;
- [x] inicializar cache;
- [x] subir scheduler de jobs;
- [x] registrar rotas em `http.ServeMux`;
- [x] iniciar `ListenAndServe`.

Padrões de implementação que devem ser preservados:

- [x] roteamento com Go stdlib;
- [x] handlers agrupados por domínio;
- [x] sem framework pesado;
- [x] SQL explícito;
- [x] autenticação JWT por middleware;
- [x] logs de request no processo principal;
- [x] scheduler embutido no backend para rotinas periódicas.

---

## 6. Database: organização interna que deve ser imitada

O diretório `database/` é tratado como um módulo próprio em Go.

Elementos essenciais:

- [x] `database.go`: função `Connect(dsn string)` que devolve `*pgxpool.Pool`;
- [x] `cmd/migrate/main.go`: CLI de migrations e seeds;
- [x] `migrations/*.sql`: versionamento de schema;
- [x] `seeds/*.sql`: dados iniciais;
- [x] `Dockerfile`: imagem mínima para rodar migrations.

Comandos operacionais suportados pelo CLI atual:

- [x] `up`
- [x] `down`
- [x] `drop`
- [x] `version`
- [x] `seed`

Regras arquiteturais:

- [x] migrations devem ser SQL puro;
- [x] cada migration tem arquivo `.up.sql` e `.down.sql`;
- [x] seeds são separados de migrations;
- [x] a imagem de database existe para operacionalizar bootstrap/evolução de schema, não para hospedar o PostgreSQL.

No Mirante, o schema inicial cobre:

- [x] usuários;
- [x] contas;
- [x] cartões;
- [x] compartilhamento de contas;
- [x] categorias;
- [x] tags;
- [x] transações;
- [x] transferências;
- [x] veículos;
- [x] abastecimentos;
- [x] manutenções;
- [x] fingerprints de importação;
- [x] budgets.

Padrões de modelagem que merecem ser replicados:

- [x] IDs em texto com UUID gerado no banco;
- [x] soft delete em várias entidades;
- [x] dinheiro em `BIGINT` centavos;
- [x] enums explícitos no PostgreSQL;
- [x] tabelas auxiliares para relações N:N e vínculos entre eventos financeiros.

---

## 7. Webapp: organização interna que deve ser imitada

O `apps/webapp` é uma aplicação separada, com build e deploy independentes do backend.

Organização principal:

- [x] `src/components/`: UI reutilizável;
- [x] `src/lib/api.ts`: único cliente HTTP;
- [x] `src/lib/auth.ts`: token local e logout;
- [x] `src/routes/`: roteamento baseado em arquivos;
- [x] `src/router.tsx`: `QueryClient` + router;
- [x] `src/main.tsx`: bootstrap da aplicação.

Padrões que devem ser mantidos:

- [x] uma camada central de API no frontend;
- [x] token JWT armazenado no cliente;
- [x] redirecionamento no `401`;
- [x] Query Client configurado globalmente;
- [x] rotas públicas agrupadas em `/auth`;
- [x] resto do app protegido por auth guard no root.

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

- [x] existe um `bru-project.json`;
- [x] existe um `opencollection.yml`;
- [x] existe uma pasta `environments/`;
- [x] cada endpoint fica em um arquivo YAML individual.

Padrão de organização:

- [x] um diretório por domínio;
- [x] um arquivo por ação HTTP;
- [x] ambiente separado para desenvolvimento;
- [x] script pós-resposta no login para persistir token;
- [x] bearer token aplicado via variável de ambiente da coleção.

Exemplo do que outra LLM deve reproduzir:

- [x] criar pasta `client-api/`;
- [x] criar coleção Bruno/OpenCollection;
- [x] separar requests por bounded context;
- [x] criar ambiente `Development`;
- [x] garantir que `Login` salva `accessToken`;
- [x] fazer os demais endpoints usarem `{{accessToken}}`.

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

- [x] incidentes vão para `docs/ops/`;
- [x] documentação de arquitetura vai para `docs/refactors/` ou `docs/designs/`;
- [x] instruções operacionais recorrentes devem ser persistidas em markdown;
- [x] documentação para LLM deve ser explícita, imperativa e baseada em estrutura alvo.

---

## 10. Fluxo de ambiente local

A stack local é orquestrada com `docker-compose.yml` na raiz.

Serviços atuais:

- [x] `db`: PostgreSQL;
- [x] `migrate`: imagem de migrations;
- [x] `backend`: API;
- [x] `webapp`: frontend servido por nginx.

Fluxo local esperado:

- [x] subir `db`;
- [x] configurar variáveis de ambiente;
- [x] aplicar migrations;
- [x] iniciar backend;
- [x] iniciar webapp;
- [x] usar `client-api` para smoke tests.

A raiz do monorepo contém variáveis compartilhadas de ambiente, enquanto `apps/backend/.env.example` documenta o app de backend.

Separação importante:

- [x] a infraestrutura local vive na raiz;
- [x] a configuração específica do app vive perto do app;
- [x] o banco não é definido dentro do backend.

---

## 11. Build e imagens Docker

Cada runtime relevante tem seu próprio `Dockerfile`.

### Backend

Imagem mínima baseada em Alpine.
Ela recebe um binário previamente compilado e apenas o executa.

Isso implica o seguinte padrão de pipeline:

- [x] compilar binário antes;
- [x] copiar binário para a imagem;
- [x] não compilar dentro do container final.

### Database

A imagem do `database/` empacota:

- [x] binário `migrate`;
- [x] migrations;
- [x] seeds.

Ela existe para rodar evolução de schema de forma reproduzível.

### Webapp

O frontend gera `dist/` antes e a imagem final usa nginx para servir assets estáticos.

Padrão de build a ser copiado:

- [x] buildar frontend fora da imagem final;
- [x] copiar `dist/` para nginx;
- [x] manter o container final simples.

---

## 12. CI/CD que deve ser reproduzido

O repositório possui pipelines em `.gitea/workflows/`.

Dois fluxos existem hoje:

## `ondev.yml`

Função:

- [x] validar a branch `development` sem publicar imagens.

Etapas principais:

- [x] clonar repositório;
- [x] compilar backend com `-mod=vendor`;
- [x] instalar dependências do webapp e buildar;
- [x] validar `docker-compose.yml`.

## `onmain.yml`

Função:

- [x] versionar automaticamente e publicar imagens no registry.

Etapas principais:

- [x] incrementar versão do backend em `apps/backend/VERSION`;
- [x] incrementar versão do frontend em `apps/webapp/package.json`;
- [x] commitar e criar tags;
- [x] buildar e publicar imagem do backend;
- [x] buildar e publicar imagem do database;
- [x] buildar e publicar imagem do webapp.

Padrões que outra LLM deve copiar:

- [x] pipeline de validação separado de pipeline de release;
- [x] versionamento por app;
- [x] imagens independentes por componente;
- [x] build do backend com `vendor`;
- [x] build do webapp separado do backend;
- [x] database tratado como artefato publicável.

---

## 13. Gestão de dependências

O backend e o módulo `database` usam `vendor/`.

Motivações:

- [x] builds reprodutíveis;
- [x] menor dependência de rede no CI;
- [x] previsibilidade em ambientes fechados.

Padrão a replicar:

- [x] cada módulo Go tem seu próprio `go.mod`;
- [x] `apps/backend` referencia `database` via `replace`;
- [x] cada módulo mantém `vendor/` próprio;
- [x] o CI compila com `GOWORK=off` e `-mod=vendor`.

O frontend permanece com seu próprio `package.json` dentro de `apps/webapp`.

Conclusão importante:

- [x] este monorepo não centraliza dependências em um único workspace JavaScript;
- [x] ele centraliza a infraestrutura e o versionamento, mas mantém cada runtime com autonomia.

---

## 14. Convenções de domínio

Um ponto forte do Mirante é o alinhamento entre todas as camadas.

Os mesmos domínios aparecem em:

- [x] handlers do backend;
- [x] rotas do frontend;
- [x] pasta `client-api`;
- [x] modelagem do banco.

Exemplos:

- [x] `accounts`
- [x] `cards`
- [x] `transactions`
- [x] `transfers`
- [x] `budgets`
- [x] `vehicles`
- [x] `settings`
- [x] `dashboard`

Ao refatorar outro projeto, preserve esse espelhamento.
Ele reduz ambiguidade e facilita onboarding humano e automatizado.

---

## 15. Regras de replicação para outra LLM

Se outra LLM for refatorar um projeto legado para esta infraestrutura, ela deve seguir estas regras em ordem:

- [x] criar a estrutura física de diretórios igual à deste blueprint;
- [x] mover todo código executável para `apps/backend` e `apps/webapp`;
- [x] extrair schema, migrations e seeds para `database/`;
- [x] criar CLI de migrations em `database/cmd/migrate`;
- [x] criar coleção `client-api/` por domínio;
- [x] criar `docs/` com separação por tipo de conhecimento;
- [x] criar `docker-compose.yml` na raiz para orquestração local;
- [x] criar Dockerfiles independentes para backend, database e webapp;
- [x] criar workflows de CI para validação e release;
- [x] alinhar nomes de módulos entre banco, API, frontend e coleção.

Regras adicionais:

- [x] evitar acoplamento entre frontend e backend fora de HTTP;
- [x] evitar migrations dentro de `apps/backend`;
- [x] evitar documentação crítica fora de `docs/`;
- [x] evitar pipelines únicos que façam tudo sem separação de contexto;
- [x] evitar estrutura genérica tipo `src/shared/everything`.

---

## 16. Checklist de conformidade

Considere que outro projeto ficou equivalente quando atender a tudo abaixo:

- [x] existe `apps/backend` como runtime independente;
- [x] existe `apps/webapp` como runtime independente;
- [x] existe `database` com migrations, seeds e CLI próprios;
- [x] existe `client-api` organizado por domínio;
- [x] existe `docs` com subpastas operacionais e arquiteturais;
- [x] existe `docker-compose.yml` na raiz;
- [x] existe um `Dockerfile` por componente implantável;
- [x] backend e database têm módulos Go separados;
- [x] frontend consome backend por cliente HTTP centralizado;
- [x] CI valida `development` e publica a partir de `main`;
- [x] versionamento de backend e webapp ocorre separadamente;
- [x] o banco é um domínio operacional explícito dentro do repositório.

---

## 17. Resumo executivo para outra LLM

Refatore o projeto-alvo para este formato mental:

- [x] o monorepo tem três produtos técnicos centrais: `backend`, `webapp`, `database`;
- [x] `client-api` é o catálogo executável dos endpoints;
- [x] `docs` é parte da infraestrutura de manutenção, não um extra;
- [x] a raiz orquestra ambiente local e CI/CD;
- [x] cada peça builda e versiona com relativa independência;
- [x] os domínios de negócio precisam manter o mesmo nome em todas as camadas.

Se precisar escolher entre "copiar código" e "copiar organização", priorize copiar a organização.
É essa organização que torna o sistema replicável, operável e fácil de migrar por humanos ou por LLMs.
