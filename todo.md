# Project TODO

## Webhooks de Pagamento
- [x] Criar endpoint REST público para receber webhooks
- [x] Implementar processamento automático de vendas
- [x] Adicionar validação de assinatura para segurança
- [x] Suportar múltiplos gateways (Stripe, Hotmart, Kiwify, Braip)
- [x] Documentar API de webhooks com exemplos
- [x] Criar testes para endpoints de webhook

## Painel Administrativo e Contadores
- [x] Criar schema de metas personalizadas no banco
- [x] Criar schema de sub-metas no banco
- [x] Implementar API CRUD para metas
- [x] Implementar API CRUD para sub-metas
- [x] Criar painel admin de configuração de metas
- [ ] Implementar contador de dias restantes
- [ ] Implementar % de meta mensal atingida
- [ ] Implementar % de meta diária atingida
- [ ] Calcular déficit/superávit do dia anterior
- [ ] Calcular déficit/superávit da semana anterior
- [ ] Exibir progresso de sub-metas
- [ ] Calcular ritmo necessário para recuperar atrasos

## Redesign e Tema
- [x] Implementar toggle de tema dark/light
- [x] Redesenhar layout do dashboard com design moderno
- [x] Adaptar logo para responder ao tema (versão dark/light)
- [x] Garantir que textos e números se adaptem ao tema
- [x] Melhorar espaçamento e hierarquia visual
- [x] Adicionar animações e transições suaves

## Correções de Design e Contador de Metas
- [x] Corrigir cor de fundo para branco (light) e preto (dark)
- [x] Remover gradiente verde do fundo
- [x] Criar componente de gauge semicircular
- [x] Mostrar % da meta total atingida no gauge
- [x] Adicionar lista de metas batidas (com linha riscada)
- [x] Adicionar lista de próximas metas
- [x] Posicionar gauge e listas no topo da página
