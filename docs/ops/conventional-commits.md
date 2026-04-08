# Padrão de Commits Convencionais

Olá! Para garantir que o `CHANGELOG.md` seja gerado de forma automática e com qualidade, configuramos uma automação que segue o padrão de **Commits Convencionais**. A partir de agora, é importante que suas mensagens de commit sigam este formato.

## O Formato

A estrutura básica é a seguinte:

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit Mais Comuns

-   **feat**: Para novas funcionalidades (gera uma seção "Features" no changelog).
-   **fix**: Para correções de bugs (gera uma seção "Bug Fixes" no changelog).
-   **docs**: Para mudanças na documentação.
-   **style**: Para formatação de código, ponto e vírgula, etc. (sem mudança de lógica).
-   **refactor**: Para refatoração de código sem alterar a funcionalidade externa.
-   **test**: Para adição ou modificação de testes.
-   **chore**: Para tarefas de build, configuração, etc. (não aparece no changelog).
-   **perf**: Para melhorias de performance.
-   **ci**: Para mudanças nos arquivos de CI/CD.

### Exemplos

**Commit simples:**

```
feat: Adiciona autenticação com Google
```

**Commit com escopo (indicando a área do projeto):**

```
fix(api): Corrige o cálculo de juros na fatura
```

**Commit com corpo (para mais detalhes):**

```
refactor: Simplifica o serviço de notificação

Remove a dependência do serviço X e utiliza o padrão de pub/sub
para desacoplar os componentes.
```

**Commit com Breaking Change (mudança que quebra a compatibilidade):**

Adicione um `!` depois do tipo/escopo ou um rodapé `BREAKING CHANGE:`. Isso terá destaque no changelog.

```
feat!: Remove o endpoint /v1/users

BREAKING CHANGE: O endpoint /v1/users foi descontinuado.
Utilize o novo endpoint /v2/profiles.
```

## Como Isso Afeta o Changelog?

A GitHub Action que configuramos irá ler essas mensagens de commit cada vez que uma nova alteração for enviada para a branch `main`. Com base nos tipos (`feat`, `fix`, etc.), ela irá agrupar as mudanças, gerar uma nova versão e atualizar o `CHANGELOG.md` automaticamente.

Seguir este padrão não só automatiza o processo de documentação, mas também torna nosso histórico de commits muito mais claro e fácil de entender!

Para mais detalhes, consulte a [especificação oficial](https://www.conventionalcommits.org/).
