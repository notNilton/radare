# 07 - Auditoria e Análise de Fragilidades

> **Status: [x] Resolvido** — 6/7 itens endereçados. Item 2 (Multi-tenancy) em andamento na Fase 6.

Este documento identifica as limitações e riscos da arquitetura atual do **Radare** para orientar as refatorações e expansões futuras.

---

## 1. Persistência e Volatilidade (Fragilidade)
- [x] **Problema:** O Canvas do React Flow não persiste. Se o usuário atualizar a página ou fechar o navegador, a topologia do grafo (nós e arestas) é perdida.
- [x] **Impacto:** O sistema só serve para cálculos rápidos, não para gerenciar modelos de plantas industriais complexas ao longo do tempo.
- [x] **Resolvido (Fase 4):** Modelo de `Workspaces` com topologia persistida no banco + `WorkspaceVersioning` com snapshots imutáveis por UUID.

---

## 2. Escalabilidade e Multi-tenancy (Limitação)
- [ ] **Problema:** Não há isolamento entre empresas. Todos os usuários compartilham o mesmo banco de dados de tags e reconciliações sem um vínculo de empresa (tenant).
- [ ] **Impacto:** O software não pode ser vendido como SaaS (Software as a Service) para múltiplos clientes reais simultâneos.
- [ ] **Plano de Ação (Fase 6):** Redesenho multi-tenant com `tenant_id` + RLS — em andamento.

---

## 3. Conectividade e Ingestão (Gargalo)
- [x] **Problema:** A entrada de dados é manual via JSON, CSV ou interface do usuário. Não há conexão automática com fontes de dados industriais (Historians, PLCs, MQTT).
- [x] **Impacto:** O operador precisa digitar os dados toda vez, o que aumenta a chance de erro humano e inviabiliza o monitoramento em tempo real contínuo.
- [x] **Resolvido (Fase 5):** Workers MQTT e InfluxDB + Redis como buffer de current values + ingestão via API Key autenticada + mapeamento De-Para de tags.

---

## 4. Inteligência Estatística (Ponto Cego)
- [x] **Problema:** O sistema aplica a reconciliação, mas não avisa se o resultado é estatisticamente aceitável (Global Test).
- [x] **Impacto:** Se houver um vazamento real ou sensor travado (erro bruto), a reconciliação "esconderá" esse erro ajustando as outras tags, gerando dados falsos.
- [x] **Resolvido (Fase 4):** Teste de Qui-quadrado (Global Test) + detecção de outliers com identificação por `outlier_index` e `outlier_tag`.

---

## 5. Segurança e Auditoria (Risco)
- [x] **Problema:** O controle de acesso é binário (logado ou não). Não há trilha de auditoria para saber quem alterou uma configuração crítica de tag.
- [x] **Impacto:** Erros operacionais são difíceis de rastrear. Falta de conformidade com normas industriais de segurança de dados.
- [x] **Resolvido (Fase 5):** RBAC com perfis `admin`, `operator`, `auditor` + Audit Logs persistidos no LogDB separado.

---

## 6. Sincronicidade do Backend (Performance)
- [x] **Problema:** A reconciliação é síncrona. Para grafos extremamente grandes, a requisição HTTP pode expirar (timeout).
- [x] **Impacto:** Limitação do tamanho da planta que pode ser processada.
- [x] **Resolvido (Fase 5):** Worker pool de goroutines (`StartReconciliationWorker`) com fila buffered de 100 slots. Endpoint aceita `"async": true` e retorna `202 Accepted`; resultado é entregue via WebSocket broadcast.

---

## 7. Poluição e Bloat do Banco (Risco de Performance)
- [x] **Problema:** Logs de auditoria, históricos de erro e estados efêmeros de cálculo estão sendo salvos no banco principal junto com a lógica de negócio.
- [x] **Impacto:** Degradação de performance em queries de Tags/Workspaces e backup excessivamente pesado com dados irrelevantes para a lógica do sistema.
- [x] **Resolvido (Fase 5):** Arquitetura Dual DB — PostgreSQL principal (Truth DB) + PostgreSQL separado (LogDB/Observability). Snapshots de reconciliação e audit logs isolados no LogDB. Tabela de reconciliações com particionamento mensal nativo.
