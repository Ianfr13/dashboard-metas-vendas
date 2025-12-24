# Arquitetura do Fluxo de Dados - GTM para Dashboard

## 1. Visão Geral

Este documento descreve o fluxo completo de dados, desde a captura de eventos no Google Tag Manager (GTM) até a exibição dos dados agregados no dashboard do frontend.

O fluxo é 100% serverless, utilizando Edge Functions do Supabase para processamento e o banco de dados PostgreSQL do Supabase para armazenamento.

## 2. Diagrama do Fluxo de Dados

```mermaid
graph TD
    subgraph Browser do Usuário
        A[Ação do Usuário] --> B{Google Tag Manager};
    end

    subgraph Supabase Cloud
        B --> C{Edge Function: gtm-event};
        C --> D[Tabela: gtm_events];
        C --> E[Tabela: daily_results];
        C --> F[Tabela: metas_principais];
        C --> G[Tabela: sub_metas];
        H{Edge Function: get-dashboard-data} --> I[Agregação de Dados];
        I --> E;
        I --> F;
        I --> G;
    end

    subgraph Frontend (React)
        J[Dashboard] --> H;
    end

    style A fill:#bbf,stroke:#333,stroke-width:2px
    style J fill:#bbf,stroke:#333,stroke-width:2px
```

## 3. Passo a Passo do Fluxo

### Passo 1: Captura do Evento no GTM

1.  **Ação do Usuário**: O usuário realiza uma ação no site (ex: faz uma compra, visualiza uma página).
2.  **GTM Data Layer**: A aplicação envia um evento para o `dataLayer` do GTM.

    ```javascript
    window.dataLayer.push({
      'event': 'purchase',
      'transaction_id': 'TXN-12345',
      'value': 997,
      'product_type': 'front',
    });
    ```

3.  **Tag do GTM**: Uma tag "Custom HTML" no GTM é acionada pelo evento `purchase`.
4.  **Chamada da Edge Function**: A tag envia os dados do evento para a Edge Function `gtm-event`.

    ```javascript
    // Dentro da tag do GTM
    fetch('https://auvvrewlbpyymekonilv.supabase.co/functions/v1/gtm-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'purchase',
        event_data: {
          transaction_id: '{{Transaction ID}}',
          value: {{Transaction Value}},
          product_type: '{{Product Type}}',
        },
      }),
    });
    ```

### Passo 2: Processamento na Edge Function `gtm-event`

A Edge Function `gtm-event` é o coração do processamento de dados. Ela executa as seguintes ações:

1.  **Log do Evento Bruto**: Insere o evento completo na tabela `gtm_events`. Isso serve como um log imutável de todos os eventos recebidos.

2.  **Processamento de Compras**: Se `event_name` for `purchase`, a função `processPurchaseEvent` é chamada:

    a.  **Determina Data e Cenário**: Calcula a data atual e o cenário de vendas.
    b.  **Classifica a Venda**: Define se a venda é de marketing direto ou comercial com base no `product_type` ou valor.
    c.  **Atualiza `daily_results`**: Busca o registro do dia atual. Se existir, atualiza os contadores de vendas e receita. Se não, cria um novo registro.
    d.  **Atualiza `metas_principais`**: Busca a meta principal do mês e ano atuais e adiciona o valor da venda ao `valor_atual`.
    e.  **Atualiza `sub_metas`**: Verifica se o novo `valor_atual` atingiu alguma sub-meta pendente e a marca como `atingida`.

### Passo 3: Exibição no Dashboard

1.  **Componente do Dashboard**: O componente principal do dashboard no frontend (React) é carregado.
2.  **Chamada da API**: O componente chama a Edge Function `get-dashboard-data` usando o helper `dashboardAPI.getData()`.

    ```typescript
    import { dashboardAPI } from '@/lib/edge-functions';

    const data = await dashboardAPI.getData();
    ```

3.  **Agregação de Dados na Edge Function `get-dashboard-data`**:

    a.  **Autenticação**: Valida o JWT do usuário.
    b.  **Busca de Dados**: Realiza múltiplas queries no Supabase para buscar:
        - A meta principal do mês (`metas_principais`).
        - Todas as sub-metas associadas (`sub_metas`).
        - Todos os resultados diários do mês (`daily_results`).
        - Todos os produtos ativos (`products`).
        - Todas as simulações ativas (`simulation_params`).
    c.  **Cálculos e Agregação**: Calcula os totais de vendas e receita do mês, o progresso da meta, etc.
    d.  **Retorno dos Dados**: Retorna um único objeto JSON (`DashboardData`) com todos os dados agregados e formatados para o frontend.

4.  **Renderização no Frontend**: O frontend recebe o objeto `DashboardData` e renderiza os componentes do dashboard (gráficos, medidores, tabelas) com os dados recebidos.

## 4. Tabelas Envolvidas

| Tabela | Propósito |
| :--- | :--- |
| `gtm_events` | Log bruto de todos os eventos do GTM. |
| `daily_results` | Dados diários de vendas e receita, atualizados por `gtm-event`. |
| `metas_principais` | Metas de faturamento mensais, atualizadas por `gtm-event`. |
| `sub_metas` | Sub-metas de faturamento, atualizadas por `gtm-event`. |
| `products` | Cadastro de produtos (usado para referência). |
| `simulation_params` | Parâmetros de simulação (usado para referência). |

## 5. Vantagens desta Arquitetura

-   **Desacoplamento**: O GTM não precisa saber a lógica de negócio. Ele apenas envia o evento.
-   **Centralização**: Toda a lógica de processamento de eventos está na Edge Function `gtm-event`.
-   **Performance**: A agregação de dados para o dashboard é feita no servidor (Edge Function `get-dashboard-data`), não no cliente, resultando em um carregamento mais rápido.
-   **Segurança**: O frontend não tem acesso direto ao banco de dados, apenas às Edge Functions, que são protegidas por JWT.
-   **Escalabilidade**: A arquitetura serverless escala automaticamente com o volume de eventos e usuários.

## 6. Como Configurar

### Passo 1: Deploy das Edge Functions

```bash
# Deploy de ambas as funções
supabase functions deploy gtm-event
supabase functions deploy get-dashboard-data
```

### Passo 2: Configurar o GTM

-   Crie as variáveis necessárias no GTM (ex: `Transaction ID`, `Transaction Value`).
-   Crie uma tag "Custom HTML" para cada evento que você deseja rastrear (purchase, lead, etc).
-   Configure os gatilhos (triggers) para disparar as tags.

### Passo 3: Usar no Frontend

-   Chame `dashboardAPI.getData()` para carregar os dados do dashboard.
-   Renderize os dados recebidos.

---

**Última atualização:** 24 de Dezembro de 2024  
**Status:** ✅ Pronto para implementação
