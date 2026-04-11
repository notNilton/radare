# 06 - Estratégia da Fase 6: Evolução Multi-Tenant

> **Status: [ ] Não Implementada**



A Fase 6 é o redesenho estrutural do banco de dados para suportar múltiplos clientes, hierarquia operacional complexa e processamento assíncrono.

---

## 1. Arquitetura Multi-Tenant

### 🚀 Backend
- [ ] **Identidade Global e Tenants:**
    - [ ] Introduzir a tabela `tenants` (empresas).
    - [ ] Criar `tenant_users` para gerenciar permissões de um usuário em diferentes empresas.
    - [ ] Adicionar `tenant_id` em todas as tabelas principais (`tags`, `workspaces`, `reconciliations`).
- [ ] **Isolamento de Dados:**
    - [ ] Configurar Row Level Security (RLS) no Postgres ou garantir filtragem por `tenant_id` em todos os handlers.

---

## 2. Hierarquia e Domínio Operacional

### 🚀 Backend
- [ ] **Níveis de Ativos:**
    - [ ] Implementar tabelas para `facilities` (unidades), `assets` (equipamentos) e `processes`.
    - [ ] Vincular tags e workspaces a níveis específicos da hierarquia para melhor organização.
- [ ] **Templates e Runs:**
    - [ ] Separar a configuração (Template) da execução (Run).
    - [ ] Criar `reconciliation_runs`, `reconciliation_measurements` e `reconciliation_results` como tabelas independentes para auditoria total.

---

## 3. Autonomia e Idempotência

### 🚀 Backend
- [ ] **Reconciliation Jobs:**
    - [ ] Implementar fila de processamento assíncrono para reconciliações pesadas (Jobs).
    - [ ] Criar `idempotency_keys` para evitar execuções duplicadas acidentais de um mesmo sensor.
- [ ] **Outbox Pattern:**
    - [ ] Implementar `outbox_events` para garantir que notificações e webhooks sejam disparados apenas após a persistência bem-sucedida da reconciliação.

---

## 4. Estratégia de Migração

- [ ] **Schema Paralelo:** Criar novas tabelas sem deletar as antigas.
- [ ] **Double Writing:** Começar a escrever nos dois formatos se possível.
- [ ] **Data Backfill:** Migrar dados legados para os novos tenants padrão.
- [ ] **Cutover:** Virar a chave da API para usar exclusivamente o novo schema multi-tenant.
