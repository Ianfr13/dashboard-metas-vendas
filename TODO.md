# ✅ TODO List - Dashboard de Metas de Vendas

**Última Atualização:** 24/12/2024

Este documento organiza as tarefas pendentes, melhorias e próximos passos para o projeto. As tarefas estão organizadas por prioridade e categoria.

## 🎯 Prioridade Alta (Crítico)

| Tarefa | Categoria | Status | Detalhes |
|---|---|---|---|
| **Implementar RLS de Produção** | Segurança | 🔴 Pendente | Substituir políticas RLS públicas por políticas baseadas em autenticação (`auth.uid()`, `auth.role()`, etc). |
| **Reabilitar JWT nas Edge Functions** | Segurança | 🔴 Pendente | Alterar `verify_jwt: false` para `true` em todas as Edge Functions antes de ir para produção. |
| **Code Splitting** | Performance | 🔴 Pendente | Implementar `React.lazy()` e `import()` dinâmico para reduzir o tamanho do bundle JS (atualmente ~1.2 MB). |

## 📈 Prioridade Média (Melhorias)

| Tarefa | Categoria | Status | Detalhes |
|---|---|---|---|
| **Validação de Uso de Produto** | Backend | 🟡 Pendente | Implementar lógica para impedir a remoção de um produto se ele estiver sendo usado em algum funil. |
| **Testes Automatizados** | Qualidade | 🟡 Pendente | Criar testes unitários (Vitest) e de integração (Cypress/Playwright) para garantir a estabilidade do código. |
| **Integração do Ticket Médio** | Funcionalidade | 🟡 Pendente | Usar o ticket médio calculado dos funis nas projeções do dashboard principal. |
| **Relatórios por Funil** | Funcionalidade | 🟡 Pendente | Criar uma nova página ou seção para visualizar a performance de cada funil individualmente. |
| **Configurar Analytics** | Configuração | 🟡 Pendente | Adicionar variáveis de ambiente `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID` para habilitar analytics. |
| **Melhorar UX de Edição Inline** | UI/UX | 🟡 Pendente | Adicionar feedback visual mais claro (ex: ícone de salvando) durante a edição inline nas páginas admin. |

## 🚀 Prioridade Baixa (Próximos Passos)

| Tarefa | Categoria | Status | Detalhes |
|---|---|---|---|
| **Página de Configurações** | Funcionalidade | 🔵 Pendente | Implementar funcionalidades na página `/admin/configuracoes` (ex: definir taxas padrão, custos, etc). |
| **Dark Mode** | UI/UX | 🔵 Pendente | Implementar um tema escuro para a aplicação. |
| **Internacionalização (i18n)** | UI/UX | 🔵 Pendente | Adicionar suporte para múltiplos idiomas. |
| **Notificações em Tempo Real** | Funcionalidade | 🔵 Pendente | Usar Supabase Realtime para notificar usuários sobre mudanças importantes (ex: meta atingida). |
| **Documentação da API** | Documentação | 🔵 Pendente | Gerar documentação automática para as Edge Functions (ex: com Swagger/OpenAPI). |

## ✅ Concluído Recentemente

- [x] Consolidar documentação em README.md único
- [x] Recriar páginas de Produtos e Funis com estrutura antiga
- [x] Corrigir erros 403 e 400 nas páginas admin
- [x] Refatorar Admin em sub-páginas modulares
- [x] Migrar backend completo de tRPC/Drizzle para Supabase
- [x] Corrigir looping de deploy no Cloudflare Worker

---

**Status dos Itens:**
- 🔴 **Pendente:** Não iniciado
- 🟡 **Em Andamento:** Em desenvolvimento
- 🔵 **Próximo:** Planejado para futuro próximo
- ✅ **Concluído:** Finalizado
