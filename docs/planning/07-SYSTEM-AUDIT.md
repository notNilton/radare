# 07 - Auditoria e Análise de Fragilidades

> **Status: [ ] Em Aberto**



Este documento identifica as limitações e riscos da arquitetura atual do **Radare** para orientar as refatorações e expansões futuras.

---

## 1. Persistência e Volatilidade (Fragilidade)
- [ ] **Problema:** O Canvas do React Flow não persiste. Se o usuário atualizar a página ou fechar o navegador, a topologia do grafo (nós e arestas) é perdida.
- [ ] **Impacto:** O sistema só serve para cálculos rápidos, não para gerenciar modelos de plantas industriais complexas ao longo do tempo.
- [ ] **Plano de Ação (Fase 4):** Implementar o modelo de `Workspaces` no banco de dados.

---

## 2. Escalabilidade e Multi-tenancy (Limitação)
- [ ] **Problema:** Não há isolamento entre empresas. Todos os usuários compartilham o mesmo banco de dados de tags e reconciliações sem um vínculo de empresa (tenant).
- [ ] **Impacto:** O software não pode ser vendido como SaaS (Software as a Service) para múltiplos clientes reais simultâneos.
- [ ] **Plano de Ação (Fase 6):** Redenho multi-tenant com `tenant_id` e RLS.

---

## 3. Conectividade e Ingestão (Gargalo)
- [ ] **Problema:** A entrada de dados é manual via JSON, CSV ou interface do usuário. Não há conexão automática com fontes de dados industriais (Historians, PLCs, MQTT).
- [ ] **Impacto:** O operador precisa digitar os dados toda vez, o que aumenta a chance de erro humano e inviabiliza o monitoramento em tempo real contínuo.
- [ ] **Plano de Ação (Fase 5):** Implementação de conectores e workers de ingestão.

---

## 4. Inteligência Estatística (Ponto Cego)
- [ ] **Problema:** O sistema aplica a reconciliação, mas não avisa se o resultado é estatisticamente aceitável (Global Test).
- [ ] **Impacto:** Se houver um vazamento real ou sensor travado (erro bruto), a reconciliação "esconderá" esse erro ajustando as outras tags, gerando dados falsos.
- [ ] **Plano de Ação (Fase 4):** Implementar o teste de Qui-quadrado e detecção de outliers.

---

## 5. Segurança e Auditoria (Risco)
- [ ] **Problema:** O controle de acesso é binário (logado ou não). Não há trilha de auditoria para saber quem alterou uma configuração crítica de tag.
- [ ] **Impacto:** Erros operacionais são difíceis de rastrear. Falta de conformidade com normas industriais de segurança de dados.
- [ ] **Plano de Ação (Fase 5):** RBAC granular e Audit Logs.

---

## 6. Sincronicidade do Backend (Performance)
- [ ] **Problema:** A reconciliação é síncrona. Para grafos extremamente grandes, a requisição HTTP pode expirar (timeout).
- [ ] **Impacto:** Limitação do tamanho da planta que pode ser processada.
- [ ] **Plano de Ação (Fase 6):** Processamento assíncrono via Jobs e Filas.
