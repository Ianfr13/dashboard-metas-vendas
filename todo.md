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

## Header Mobile - Remover Sticky
- [x] Remover sticky position do header em mobile (Home)
- [x] Remover sticky position do header em mobile (Métricas)
- [x] Remover sticky position do header em mobile (Admin)
- [x] Manter sticky apenas em desktop

## Header - Logo e Textos
- [x] Corrigir caminho da logo DouraVita em todas as páginas
- [x] Simplificar texto: "Dashboard de Metas" (título) e "Janeiro 2025" (subtítulo)
- [x] Otimizar hierarquia tipográfica
- [x] Melhorar peso e tamanho das fontes

## Otimização GoalGauge (Medidor Meia Lua)
- [x] Reduzir tamanho do gauge em mobile
- [x] Ajustar proporções para telas pequenas
- [x] Aumentar espessura/opacidade da barra vazia (background)
- [x] Melhorar contraste em dark mode
- [x] Melhorar contraste em light mode

## Dropdown de Período e Métricas Detalhadas
- [x] Adicionar dropdown de período (Dia/Semana/Mês) abaixo das sub-metas
- [x] Criar cards de métricas: Total, Marketing, Comercial, Ticket Médio
- [x] Implementar visualização de métricas por período selecionado
- [x] Adicionar ícones e cores distintas para cada card
- [x] Mostrar valores esperados vs realizados

## Seleção de Intervalo de Datas e Celebração de Meta
- [x] Substituir seletor de data único por seletor de intervalo (data inicial e final)
- [x] Calcular valores realizados e esperados para o período selecionado
- [x] Criar componente de animação de fogos de artifício
- [x] Adicionar banner "META BATIDA!" quando meta for atingida
- [x] Detectar quando meta é batida no período selecionado
- [x] Ajustar gauge para mostrar valores além de 100%
- [x] Continuar contagem e mostrar quanto excedeu a meta

## Correção de Erro - Canvas Confetti
- [x] Criar canvas element explicitamente para confetti
- [x] Garantir que canvas existe antes de chamar confetti
- [x] Adicionar cleanup do canvas ao desmontar componente

## Otimização Banner de Celebração
- [x] Redesenhar banner para melhor visual em desktop
- [x] Ajustar tamanho e padding para mobile
- [x] Melhorar posicionamento e responsividade
- [x] Ajustar tamanho da fonte para diferentes telas

## Simplificação Banner Celebração
- [x] Remover fundo verde grande
- [x] Posicionar banner pequeno abaixo do header
- [x] Design mais discreto e elegante
- [x] Manter apenas fogos de artifício

## Página de Métricas - Implementação Completa
- [x] Instalar recharts para gráficos
- [x] Criar gráfico de evolução temporal (linha)
- [x] Criar funil de conversão visual
- [x] Adicionar tabela detalhada de produtos
- [x] Implementar comparação Marketing vs Comercial
- [x] Adicionar métricas das últimas 24h
- [x] Implementar score de saúde do negócio
- [x] Adicionar botão de exportação PDF (UI)
- [ ] Conectar dados reais do GTM

## Refatoração Página Métricas - Foco em Metas
- [x] Remover componentes estratégicos (HealthScore, análises complexas)
- [x] Criar visão simples: Meta vs Realizado
- [x] Mostrar quanto falta para cada meta (total e por produto)
- [x] Adicionar progress bars visuais para cada meta
- [x] Exibir vendas por produto com quanto falta
- [x] Design motivacional para toda equipe acompanhar

## Ajustes Página Métricas - Barra Gradiente
- [x] Remover card de meta total (já existe na Home)
- [x] Focar apenas em vendas por produto
- [x] Criar barra gradiente: 0-33% vermelho, 33-66% amarelo, 66-100% verde
- [x] Clarear/escurecer cores dentro de cada faixa de 33%
- [x] Mostrar quantas vendas devem ser feitas e quanto falta

## Reestruturação Métricas - Funis Separados
- [x] Criar tab "Funil de Marketing"
- [x] Mostrar etapas: Views VSL → Leads → Checkout → Vendas
- [x] Breakdown por produto em cada etapa
- [x] Métricas: CPL, CPA, ROI, ROAS, taxas de conversão
- [x] Criar tab "Funil Comercial"
- [x] Mostrar etapas: Leads → Reuniões Agendadas → Reuniões Realizadas → Propostas → Vendas
- [x] Breakdown por produto em cada etapa
- [x] Métricas: Show-up rate, taxa de fechamento, ticket médio
- [x] Barra gradiente em cada produto
- [x] Quanto falta para meta por produto

## Refatoração Métricas - Dropdowns e Gráficos
- [x] Remover "Views VSL" do funil de Marketing
- [x] Separar produtos por canal (Marketing/Comercial/Ambos)
- [x] Adicionar dropdown para selecionar etapa do funil
- [x] Adicionar dropdown para selecionar produto (ou "Todos")
- [x] Criar gráfico de evolução temporal da etapa selecionada
- [x] Adicionar grid completo de métricas por produto
- [x] Métricas: CPL, CPA, Taxa Conversão, Custo Total, Receita, ROI, ROAS, Ticket Médio, etc
- [x] Layout responsivo com gráfico + métricas

## Ajustes Métricas - Novas Métricas e Funil Comercial
- [x] Remover "Leads Qualificados" do funil comercial
- [x] Adicionar métricas financeiras: LTV, CAC, Payback Period, Margem Contribuição, Break-even
- [x] Adicionar métricas de qualidade: Taxa Chargeback, Taxa Reembolso
- [x] Adicionar métricas temporais: Melhor hora, Melhor dia, Tempo médio lead→venda, Velocidade conversão
- [x] Distribuir métricas apropriadamente entre as etapas

## Otimização Layout Página Métricas
- [x] Reorganizar grid de métricas com melhor espaçamento
- [x] Agrupar métricas por categoria (Financeiras, Qualidade, Temporais)
- [x] Adicionar separadores visuais entre grupos
- [x] Melhorar tipografia e hierarquia visual
- [x] Otimizar para mobile

## Área Admin - Sistema de Configuração
- [x] Criar estrutura com tabs: Metas, Produtos, Custos, Cenários, Período
- [x] Formulário de Meta Mensal Total com cálculos automáticos (diária, semanal, sub-metas)
- [x] Formulário de Produtos (nome, ticket médio, canal)
- [x] Cálculo automático de vendas necessárias por produto
- [x] Formulário de Distribuição Marketing vs Comercial (%)
- [x] Formulário de Custos (CPL, CPA) com cálculo de orçamento
- [x] Sistema de edição manual com flag "customizado"
- [x] Preview em tempo real das configurações
- [x] Botão "Salvar Configurações" com persistência
- [x] Botão "Resetar para Cálculos Automáticos"

## Sistema de Funil de Produtos
- [x] Alterar "Ticket Médio" para "Valor do Produto" (preço fixo)
- [x] Adicionar campo "Tipo no Funil": Frontend / Backend (Upsell) / Downsell
- [x] Adicionar campo "Produto Pai" para vincular backend/downsell ao frontend
- [x] Criar visualização de funil completo (frontend → backend → downsell)
- [x] Adicionar campo "Taxa de Take" esperada para backend/downsell
- [x] Calcular ticket médio real baseado em: valor base + (backend × taxa) + (downsell × taxa)
- [x] Mostrar preview do ticket médio calculado
- [x] Permitir edição manual do ticket médio (flag customizado)
