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

## Correções Urgentes de Design
- [x] Corrigir formato do gauge para semicírculo correto (.-.)  
- [x] Mostrar apenas % da meta no centro do gauge
- [x] Metas devem ser apenas valores monetários (R$ 500k, R$ 1M, etc)
- [x] Corrigir fundo branco puro (sem tom verde)
- [x] Tornar logo visível em ambos os temas
- [x] Adicionar filtro de período (diário, semanal, mensal)
- [x] Otimizar paleta de cores completa
- [x] Melhorar contraste e legibilidade

## Sistema de Meta Principal e Sub-metas
- [x] Criar interface para definir meta principal (ex: R$ 5M)
- [x] Adicionar interface para criar sub-metas personalizadas
- [x] Substituir "Próximas Metas" por sub-metas configuráveis
- [x] Salvar meta principal e sub-metas no banco de dados
- [x] Atualizar gauge para usar meta principal
- [ ] Marcar sub-metas como batidas automaticamente

## Otimização de Interface
- [x] Transformar cards de cenários em dropdown compacto
- [x] Remover calculadora de métricas do dashboard
- [x] Ajustar layout para melhor uso do espaço

## Filtro de Calendário
- [x] Adicionar seletor de data (dia/mês/ano)
- [x] Implementar visualização de faturamento por data específica
- [x] Permitir comparação entre períodos
- [x] Adaptar dashboard para uso permanente (não apenas janeiro)
- [x] Buscar dados reais do banco por período selecionado

## Página Admin e Ajustes de Sub-metas
- [x] Criar rota /admin para configuração de metas
- [x] Criar interface para definir meta principal
- [x] Criar interface para adicionar/remover sub-metas personalizadas
- [x] Salvar configurações no banco de dados
- [x] Remover "Próximas Metas" do Home
- [x] Mostrar apenas sub-metas no Home
- [x] Aumentar tamanho do gauge
- [x] Adicionar valor da meta final no gauge
- [ ] Implementar lógica para riscar sub-metas atingidas
- [ ] Buscar dados reais do banco para calcular progresso

## Simplificação de Métricas
- [x] Remover conversão VSL da tabela
- [x] Remover CPA alvo da tabela
- [x] Manter apenas: Vendas Esperadas, Receita Esperada, Vendas, Receita
- [x] Otimizar formatação de números
- [x] Melhorar legibilidade da tabela

## Ajuste de Fonte das Métricas
- [x] Reduzir tamanho da fonte dos números (de 3xl para xl)
- [x] Garantir que valores grandes caibam sem quebrar layout
- [x] Testar com valores grandes (R$ 2.550.000+)

## Reestruturação do Dashboard
- [x] Remover "Metas Semanais" do Home
- [x] Remover "Resumo Semanal" do Home
- [x] Criar schema de produtos no banco
- [x] Criar API CRUD de produtos
- [x] Adicionar gerenciamento de produtos no Admin
- [x] Criar página /metricas
- [x] Adicionar vendas por produto
- [x] Adicionar métricas de leads
- [x] Adicionar taxa de conversão
- [x] Adicionar CPA real
- [x] Adicionar ticket médio por produto
- [x] Adicionar funil de vendas
- [x] Adicionar performance por gateway
- [ ] Adicionar gráficos de evolução

## Integração com Google Tag Manager
- [x] Criar tabela gtm_events no banco de dados
- [x] Criar endpoints REST para receber eventos do GTM
  - [x] POST /api/gtm/page-view (Views VSL)
  - [x] POST /api/gtm/generate-lead (Leads Gerados)
  - [x] POST /api/gtm/begin-checkout (Checkout Iniciado)
  - [x] POST /api/gtm/purchase (Vendas Concluídas)
- [ ] Integrar eventos com página de Métricas
- [x] Criar documentação para gestor de tráfego
- [x] Testar endpoints

## Navegação no Header
- [x] Adicionar botões de navegação no header (Home, Métricas, Admin)
- [x] Destacar página ativa
- [x] Garantir responsividade em mobile

## Correção de Layout - Página Métricas
- [x] Remover filtros de data/período do header
- [x] Mover filtros para área de conteúdo principal
- [x] Manter apenas navegação e toggle de tema no header

## Toggle de Tema - Página Admin
- [x] Adicionar toggle dark/light no header da página Admin
- [x] Garantir consistência visual com outras páginas

## Otimização Mobile - Navegação
- [x] Criar componente MobileNav com menu hambúrguer
- [x] Adicionar Sheet/Drawer para menu lateral
- [x] Integrar em todas as páginas (Home, Métricas, Admin)
- [x] Garantir que navegação desktop permaneça visível em telas grandes
- [x] Testar responsividade em diferentes tamanhos de tela
