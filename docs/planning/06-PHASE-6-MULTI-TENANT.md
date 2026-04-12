# 06 - Estratégia da Fase 6: Reboot Multi-Tenant (Clean Slate)

> **Status: [ ] Planejada**

A Fase 6 representa uma quebra de compatibilidade (Breaking Change) para transformar o Radare em uma plataforma SaaS escalável. Não haverá migração de dados; o banco de dados será resetado para o novo schema multi-tenant e hierárquico.

---

## 1. Identidade e Isolamento (Multi-Tenant)

### 🚀 Backend
- [ ] **Core Schema V2:**
    - [ ] Criar tabela `tenants` como raiz de todos os dados.
    - [ ] Implementar `tenant_id` em todas as entidades (tags, workspaces, reconciliations).
- [ ] **Segurança de Dados:**
    - [ ] Implementar Row Level Security (RLS) no PostgreSQL para garantir isolamento físico entre clientes.
    - [ ] Refatorar middlewares para extrair o `tenant_id` do JWT e aplicar nos contextos das queries.

---

## 2. Nova Hierarquia Industrial (Asset Management)

### 🚀 Backend
- [ ] **Domínio de Ativos:**
    - [ ] Implementar `sites` (unidades físicas), `units` (unidades de processo) e `equipment`.
    - [ ] Vincular `workspaces` (grafos) a níveis específicos dessa hierarquia.
- [ ] **Modelagem de Execução:**
    - [ ] Separar `templates` (definição do grafo) de `runs` (instância de cálculo com dados reais).
    - [ ] Tabela `reconciliation_results` otimizada para séries temporais e auditoria.

---

## 3. Processamento em Larga Escala (Async)

### 🚀 Backend
- [ ] **Worker Engine:**
    - [ ] Implementar fila de processamento assíncrono para cálculos complexos.
    - [ ] Suporte a Webhooks para notificar sistemas externos após a conclusão de uma "run".
- [ ] **Idempotência Técnica:**
    - [ ] Uso obrigatório de `idempotency_keys` em todas as ingestões para evitar duplicidade de medições em cenários de alta frequência.

---

## 4. Execução do Reboot

- [ ] **Nuke & Pave:** Script para purgar o banco de dados atual e aplicar o novo schema.
- [ ] **Fresh Start:** Inicialização de tenants padrão para testes internos.
- [ ] **API V2:** Lançamento da nova especificação de endpoints sob o prefixo `/v2/`.
