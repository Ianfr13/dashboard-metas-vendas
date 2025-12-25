# Planejamento de Métricas e Simulações - Dashboard DouraVita

## Métricas Primárias a Implementar

### Marketing Direto (VSL/TSL)
1. **Views na VSL/TSL** = Vendas ÷ Taxa de Conversão VSL
2. **Leads Gerados** = Views × CTR (Click-Through Rate)
3. **CPL (Custo Por Lead)** = Investimento Total ÷ Leads
4. **CPA (Custo Por Aquisição)** = Investimento Total ÷ Vendas
5. **Investimento em Tráfego** = Vendas × CPA Alvo
6. **ROI** = (Receita - Investimento) ÷ Investimento × 100
7. **ROAS** = Receita ÷ Investimento

### Time Comercial
1. **Leads Qualificados** = Agendamentos SDR
2. **Taxa de Conversão SDR→Venda** = Vendas ÷ Agendamentos
3. **Custo Por Lead Qualificado** = Investimento ÷ Leads Qualificados
4. **Ticket Médio por Produto** (5k, 15k, 25k, 60k)

## Parâmetros Editáveis para Simulação

### Conversões
- Taxa de Conversão VSL (padrão: 1.5%)
- Taxa de Conversão TSL (padrão: 1.5%)
- Taxa de Conversão Checkout (padrão: 80%)
- Taxa de Conversão Upsell (padrão: 25%)
- Taxa de Conversão SDR (padrão: 20%)

### Custos
- CPA Alvo (padrão: R$ 450)
- CPL Alvo (padrão: R$ 30)
- CTR Médio (padrão: 3%)

### Produtos
- Ticket Médio Front (padrão: R$ 797)
- Ticket Médio Upsell (padrão: R$ 247)
- Ticket Médio Funil Completo (padrão: R$ 1.000)

### Time Comercial
- Agendamentos Diários por SDR (padrão: 4)
- Número de SDRs
- Número de Closers

## Estrutura de Dados

```typescript
interface SimulationParams {
  // Conversões
  vslConversionRate: number;
  tslConversionRate: number;
  checkoutConversionRate: number;
  upsellConversionRate: number;
  sdrConversionRate: number;
  
  // Custos
  targetCPA: number;
  targetCPL: number;
  avgCTR: number;
  
  // Produtos
  frontTicket: number;
  upsellTicket: number;
  avgTicket: number;
  
  // Time
  sdrDailyMeetings: number;
  sdrCount: number;
  closerCount: number;
}

interface CalculatedMetrics {
  // Por período (dia/semana/mês)
  requiredViews: number;
  requiredLeads: number;
  trafficInvestment: number;
  expectedRevenue: number;
  roi: number;
  roas: number;
  cpl: number;
  cpa: number;
  
  // Breakdown
  frontSales: number;
  upsellSales: number;
  totalSales: number;
}
```

## Layout de Interface

### Seção 1: Painel de Simulação (Topo)
- Cards editáveis com inputs para parâmetros principais
- Botão "Resetar Padrões"
- Indicador visual de mudanças

### Seção 2: Métricas Calculadas (Cards)
- Views Necessárias
- Leads Necessários
- Investimento em Tráfego
- CPA Real vs. Alvo
- CPL Real vs. Alvo
- ROI / ROAS

### Seção 3: Breakdown Detalhado (Tabs)
- **Diário**: Todas as métricas por dia
- **Semanal**: Agregado semanal
- **Mensal**: Visão completa do mês

### Seção 4: Comparador de Cenários
- Tabela lado a lado: 3M vs 4M vs 5M
- Destacar diferenças de investimento necessário

## Fórmulas de Cálculo

### Marketing Direto
```
Views VSL = Vendas ÷ (Taxa Conv VSL × Taxa Conv Checkout)
Leads = Views VSL × CTR
CPL = Investimento ÷ Leads
CPA = Investimento ÷ Vendas
Investimento = Vendas × CPA Alvo
ROI = ((Receita - Investimento) ÷ Investimento) × 100
ROAS = Receita ÷ Investimento
```

### Time Comercial
```
Agendamentos Totais = SDRs × Agendamentos Diários × Dias Úteis
Vendas = Agendamentos × Taxa Conversão SDR
Receita = Soma(Vendas por Produto × Ticket)
```

## Validações
- CPA não pode ser maior que ticket médio
- Taxa de conversão entre 0.1% e 10%
- ROI mínimo esperado: 100%
- ROAS mínimo esperado: 2.0
