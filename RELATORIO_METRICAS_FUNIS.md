# 📊 Relatório: Implementação de Métricas de Funis com Conversão por Etapa

**Data:** 25/12/2025  
**Objetivo:** Mostrar métricas de funis cadastrados com conversão de cada etapa (frontend → backend → downsell) baseado em dados do GTM

---

## 🔍 Análise Profunda Realizada

### 1. Estado Atual da Página Métricas

**Estrutura Existente:**
- ✅ Página `/metricas` com 5 abas:
  1. **Funil de Conversão** - Funil genérico (pageViews → leads → checkouts → purchases)
  2. **Evolução** - Gráfico temporal de eventos
  3. **Produtos** - Métricas por produto
  4. **Funil Marketing** - Métricas do funil de marketing (CPL, CPA, conversão)
  5. **Funil Comercial** - Métricas do funil comercial (agendamentos, contatos, vendas)

**Componentes:**
- ✅ `FunilMarketing.tsx` - Componente com 4 visualizações (Cards, Tabela, Stage, Gráfico)
- ✅ `FunilComercial.tsx` - Componente com 4 visualizações
- ✅ Filtros de data (startDate/endDate)
- ✅ Loading states e error handling

**Limitação Identificada:**
- ❌ **NÃO mostra métricas dos funis cadastrados** (tabela `funis`)
- ❌ **NÃO mostra conversão por etapa de produto** (frontend → backend → downsell)
- ❌ **NÃO relaciona vendas do GTM com produtos específicos do funil**

---

### 2. Estrutura de Funis no Banco de Dados

**Tabelas Envolvidas:**

#### `funis`
```typescript
interface Funil {
  id: number;
  nome: string;
  url?: string;
  ticket_medio?: number;
  active: number;
  created_at: string;
}
```

#### `produtos_funil` (inferido do código)
```typescript
interface ProdutoNoFunil {
  id: number;
  funil_id: number;
  produto_id: number;
  tipo: 'frontend' | 'backend' | 'downsell';
  ordem: number;
}
```

#### `products`
```typescript
interface Produto {
  id: number;
  name: string;
  price: number;
  channel: string;
  url?: string;
  active: number;
}
```

**Estrutura do Funil:**
```
Funil → Produto Frontend (obrigatório)
     ├→ Produto Backend (opcional, upsell 30%)
     └→ Produto Downsell (opcional, 20% dos que não compraram backend)
```

---

### 3. Dados do GTM Disponíveis

**Tabela:** `gtm_events`

**Eventos Relevantes:**
```typescript
{
  event_name: 'page_view' | 'generate_lead' | 'begin_checkout' | 'purchase',
  event_data: {
    value?: number,
    transaction_value?: number,
    product_name?: string,
    item_name?: string,
    product_type?: string,
    // ... outros campos
  },
  timestamp: string,
  user_id?: string,
  session_id?: string,
  page_url?: string
}
```

**Problema Identificado:**
- ❌ **Eventos do GTM NÃO têm referência direta ao `produto_id` da tabela `products`**
- ❌ **Eventos do GTM NÃO têm referência ao `funil_id`**
- ⚠️ **Matching precisa ser feito por `product_name` ou `page_url`**

---

### 4. Edge Functions Existentes

#### ✅ `get-funnel-metrics` (CRIADA, NÃO DEPLOYADA)
- **Localização:** `supabase/functions/get-funnel-metrics/index.ts`
- **Funcionalidade:**
  - Calcula métricas de **Funil Marketing** (leads, vendas, CPL, CPA)
  - Calcula métricas de **Funil Comercial** (agendamentos, contatos, vendas)
  - Retorna `evolutionData` (breakdown semanal)
- **Limitação:** NÃO calcula métricas por funil cadastrado

#### ✅ `gtm-analytics` (EXISTENTE, DEPLOYADA)
- **Handlers:**
  - `funnel.ts` - Funil genérico (pageViews → leads → checkouts → purchases)
  - `evolution.ts` - Evolução temporal de eventos
  - `products.ts` - Métricas por produto (baseado em `product_name`)

---

## 🎯 O Que Precisa Ser Criado

### Requisito do Usuário:
> "Eu quero poder ver as métricas dos funis. As métricas devem ser calculadas automaticamente pelo backend baseado nos dados que vêm do GTM. E nas métricas do funil deve mostrar certinho a conversão de cada etapa do funil. Desde o frontend até o último produto."

### Tradução Técnica:

**Funcionalidade Nova:** Aba "Funis Cadastrados" na página Métricas

**Estrutura:**
```
Funis Cadastrados
├─ Dropdown: Selecionar Funil
├─ Período: startDate / endDate
└─ Métricas por Etapa:
   ├─ Frontend (Produto Principal)
   │  ├─ Visualizações (page_view na URL do funil)
   │  ├─ Leads (generate_lead)
   │  ├─ Checkouts (begin_checkout)
   │  ├─ Vendas (purchase do produto frontend)
   │  ├─ Receita
   │  └─ Taxa de Conversão (vendas / visualizações)
   │
   ├─ Backend (Upsell)
   │  ├─ Ofertas (30% das vendas frontend)
   │  ├─ Vendas Backend
   │  ├─ Receita Backend
   │  └─ Taxa de Take (vendas backend / ofertas)
   │
   └─ Downsell
      ├─ Ofertas (20% dos que não compraram backend)
      ├─ Vendas Downsell
      ├─ Receita Downsell
      └─ Taxa de Take (vendas downsell / ofertas)
```

---

## 🏗️ Arquitetura da Solução

### Opção 1: Criar Nova Edge Function (RECOMENDADO ✅)

**Nome:** `get-funnel-by-id-metrics`

**Endpoint:** `/functions/v1/get-funnel-by-id-metrics?funnel_id=1&startDate=...&endDate=...`

**Lógica:**

```typescript
// 1. Buscar funil e seus produtos
const funil = await supabase
  .from('funis')
  .select(`
    *,
    produtos_funil (
      *,
      products (*)
    )
  `)
  .eq('id', funnel_id)
  .single();

// 2. Identificar produtos por tipo
const produtoFrontend = funil.produtos_funil.find(p => p.tipo === 'frontend');
const produtoBackend = funil.produtos_funil.find(p => p.tipo === 'backend');
const produtoDownsell = funil.produtos_funil.find(p => p.tipo === 'downsell');

// 3. Buscar eventos do GTM relacionados ao funil
// MATCHING por:
// - page_url contém funil.url
// - product_name === produto.name

// 4. Calcular métricas por etapa
// Frontend:
const visualizacoes = eventos.filter(e => 
  e.event_name === 'page_view' && 
  e.page_url?.includes(funil.url)
).length;

const vendasFrontend = eventos.filter(e => 
  e.event_name === 'purchase' && 
  e.event_data.product_name === produtoFrontend.products.name
).length;

// Backend (30% das vendas frontend recebem oferta):
const ofertasBackend = Math.round(vendasFrontend * 0.30);
const vendasBackend = eventos.filter(e => 
  e.event_name === 'purchase' && 
  e.event_data.product_name === produtoBackend?.products.name
).length;

// Downsell (20% dos que não compraram backend):
const naoCompraramBackend = ofertasBackend - vendasBackend;
const ofertasDownsell = Math.round(naoCompraramBackend * 0.20);
const vendasDownsell = eventos.filter(e => 
  e.event_name === 'purchase' && 
  e.event_data.product_name === produtoDownsell?.products.name
).length;

// 5. Retornar métricas estruturadas
return {
  funil: {
    id: funil.id,
    nome: funil.nome,
    url: funil.url
  },
  frontend: {
    produto: produtoFrontend.products.name,
    visualizacoes,
    leads,
    checkouts,
    vendas: vendasFrontend,
    receita: receitaFrontend,
    taxaConversao: (vendasFrontend / visualizacoes) * 100
  },
  backend: produtoBackend ? {
    produto: produtoBackend.products.name,
    ofertas: ofertasBackend,
    vendas: vendasBackend,
    receita: receitaBackend,
    taxaTake: (vendasBackend / ofertasBackend) * 100
  } : null,
  downsell: produtoDownsell ? {
    produto: produtoDownsell.products.name,
    ofertas: ofertasDownsell,
    vendas: vendasDownsell,
    receita: receitaDownsell,
    taxaTake: (vendasDownsell / ofertasDownsell) * 100
  } : null,
  totais: {
    vendasTotais: vendasFrontend + vendasBackend + vendasDownsell,
    receitaTotal: receitaFrontend + receitaBackend + receitaDownsell,
    ticketMedio: receitaTotal / vendasTotais
  }
};
```

---

### Opção 2: Estender Edge Function Existente

**Modificar:** `get-funnel-metrics` para aceitar `funnel_id` como parâmetro

**Prós:**
- ✅ Reaproveita código existente
- ✅ Menos arquivos novos

**Contras:**
- ❌ Mistura lógicas diferentes (Marketing/Comercial vs Funis Cadastrados)
- ❌ Mais complexo de manter

---

## 🚀 Plano de Implementação (SEM QUEBRAR NADA)

### Fase 1: Criar Edge Function Nova ✅

**Arquivo:** `supabase/functions/get-funnel-by-id-metrics/index.ts`

**Passos:**
1. Criar estrutura básica da função
2. Implementar lógica de matching (GTM events → produtos do funil)
3. Calcular métricas por etapa (frontend, backend, downsell)
4. Testar localmente
5. Deploy: `supabase functions deploy get-funnel-by-id-metrics`

---

### Fase 2: Criar Componente Frontend ✅

**Arquivo:** `client/src/components/metricas/FunisCadastrados.tsx`

**Estrutura:**
```typescript
interface FunisCadastradosProps {
  startDate: Date;
  endDate: Date;
}

export default function FunisCadastrados({ startDate, endDate }: FunisCadastradosProps) {
  const [funis, setFunis] = useState<Funil[]>([]);
  const [selectedFunilId, setSelectedFunilId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<FunnelByIdMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Carregar lista de funis
  useEffect(() => {
    loadFunis();
  }, []);

  // 2. Carregar métricas do funil selecionado
  useEffect(() => {
    if (selectedFunilId) {
      loadFunnelMetrics(selectedFunilId);
    }
  }, [selectedFunilId, startDate, endDate]);

  // 3. Renderizar:
  // - Dropdown de funis
  // - Cards com métricas por etapa
  // - Gráfico de funil (visualizações → vendas frontend → backend → downsell)
  // - Tabela de conversão
}
```

---

### Fase 3: Adicionar Nova Aba na Página Métricas ✅

**Arquivo:** `client/src/pages/Metricas.tsx`

**Modificação:**
```typescript
<TabsList className="grid w-full grid-cols-6"> {/* Era 5, agora 6 */}
  <TabsTrigger value="funil">Funil de Conversão</TabsTrigger>
  <TabsTrigger value="evolucao">Evolução</TabsTrigger>
  <TabsTrigger value="produtos">Produtos</TabsTrigger>
  <TabsTrigger value="marketing">Funil Marketing</TabsTrigger>
  <TabsTrigger value="comercial">Funil Comercial</TabsTrigger>
  <TabsTrigger value="cadastrados">Funis Cadastrados</TabsTrigger> {/* NOVO */}
</TabsList>

<TabsContent value="cadastrados" className="space-y-6">
  <FunisCadastrados 
    startDate={startDate}
    endDate={endDate}
  />
</TabsContent>
```

---

## ⚠️ Desafios e Soluções

### Desafio 1: Matching GTM Events → Produtos

**Problema:** Eventos do GTM não têm `produto_id`

**Solução:**
```typescript
// Matching por nome do produto
const vendasProduto = eventos.filter(e => 
  e.event_name === 'purchase' && 
  (e.event_data.product_name === produto.name || 
   e.event_data.item_name === produto.name)
);

// OU Matching por URL (se produto tiver URL)
const vendasProduto = eventos.filter(e => 
  e.event_name === 'purchase' && 
  e.page_url?.includes(produto.url)
);
```

---

### Desafio 2: Taxas de Take Fixas (30% backend, 20% downsell)

**Problema:** Taxas hardcoded no código

**Solução Futura:**
- Adicionar campos `taxa_backend` e `taxa_downsell` na tabela `funis`
- Permitir configuração por funil no Admin

**Solução Atual:**
- Usar taxas padrão (30% e 20%) como está no código de `Funis.tsx`

---

### Desafio 3: Eventos de Leads/Checkouts por Produto

**Problema:** Como saber quais leads/checkouts são do produto frontend específico?

**Solução:**
```typescript
// Filtrar por URL do funil
const leadsFunil = eventos.filter(e => 
  e.event_name === 'generate_lead' && 
  e.page_url?.includes(funil.url)
);

const checkoutsFunil = eventos.filter(e => 
  e.event_name === 'begin_checkout' && 
  e.page_url?.includes(funil.url)
);
```

---

## 📊 Exemplo de Output Esperado

```json
{
  "funil": {
    "id": 1,
    "nome": "Funil Creatina Pro",
    "url": "https://exemplo.com/creatina"
  },
  "frontend": {
    "produto": "Creatina Pro 797",
    "visualizacoes": 10000,
    "leads": 1250,
    "checkouts": 500,
    "vendas": 85,
    "receita": 67745.00,
    "taxaConversao": 0.85
  },
  "backend": {
    "produto": "Combo Creatina + Whey",
    "ofertas": 26,
    "vendas": 8,
    "receita": 15920.00,
    "taxaTake": 30.77
  },
  "downsell": {
    "produto": "Creatina Basic 397",
    "ofertas": 4,
    "vendas": 1,
    "receita": 397.00,
    "taxaTake": 25.00
  },
  "totais": {
    "vendasTotais": 94,
    "receitaTotal": 84062.00,
    "ticketMedio": 894.28
  }
}
```

---

## ✅ Checklist de Implementação

### Backend (Edge Function)
- [ ] Criar arquivo `supabase/functions/get-funnel-by-id-metrics/index.ts`
- [ ] Implementar query para buscar funil com produtos
- [ ] Implementar lógica de matching (GTM events → produtos)
- [ ] Implementar cálculo de métricas por etapa
- [ ] Adicionar guards para divisão por zero
- [ ] Adicionar validação de parâmetros
- [ ] Testar localmente
- [ ] Deploy: `supabase functions deploy get-funnel-by-id-metrics`

### Frontend (Componente)
- [ ] Criar arquivo `client/src/components/metricas/FunisCadastrados.tsx`
- [ ] Implementar dropdown de seleção de funil
- [ ] Implementar chamada à Edge Function
- [ ] Implementar visualização de métricas por etapa
- [ ] Adicionar gráfico de funil (opcional)
- [ ] Adicionar loading states
- [ ] Adicionar error handling

### Integração (Página Métricas)
- [ ] Adicionar nova aba "Funis Cadastrados"
- [ ] Importar componente `FunisCadastrados`
- [ ] Passar props `startDate` e `endDate`
- [ ] Testar navegação entre abas

### Testes
- [ ] Testar com funil sem backend/downsell
- [ ] Testar com funil completo (frontend + backend + downsell)
- [ ] Testar com período sem dados
- [ ] Testar com múltiplos funis

---

## 🎯 Próximos Passos Recomendados

1. **Revisar este relatório** e confirmar se a solução atende ao requisito
2. **Decidir** se vai criar nova Edge Function ou estender existente
3. **Implementar** em fases (backend → frontend → integração)
4. **Testar** cada fase antes de avançar
5. **Criar PR** para revisão antes de merge

---

## 📝 Observações Importantes

### ⚠️ Limitações Atuais:
1. **Matching imperfeito:** Depende de `product_name` ou `page_url` bater exatamente
2. **Taxas fixas:** 30% backend e 20% downsell hardcoded
3. **Sem tracking de sessão:** Não sabemos se o mesmo usuário passou por todas as etapas

### 🚀 Melhorias Futuras:
1. Adicionar `product_id` nos eventos do GTM
2. Adicionar `funnel_id` nos eventos do GTM
3. Tracking de sessão/usuário completo
4. Taxas configuráveis por funil
5. Análise de cohort (quantos % realmente passam de frontend → backend)

---

**Fim do Relatório**
