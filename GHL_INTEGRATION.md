## 🤝 Integração Completa com GoHighLevel (GHL)

O projeto agora está totalmente integrado com o GoHighLevel CRM, permitindo sincronizar dados do time comercial e fazer match com vendas do GTM.

### 🎯 Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Sincronização de Vendedores** | Busca usuários do GHL e salva em `ghl_users` |
| **Sincronização de Leads** | Busca contatos do GHL e salva em `ghl_contacts` |
| **Sincronização de Agendamentos** | Busca agendamentos e salva em `ghl_appointments` |
| **Sincronização de Reuniões** | Cria registros em `ghl_meetings` para agendamentos completados |
| **Match Inteligente** | Sincroniza vendas do GTM com leads do CRM |

### 🏗️ Arquitetura

```
GoHighLevel API
      ↓
Edge Function (sync-ghl)
      ↓
Supabase Database
  - ghl_users
  - ghl_contacts
  - ghl_appointments
  - ghl_meetings
  - crm_gtm_sync
```

### 🤖 Edge Function: `sync-ghl`

Esta função é o coração da integração. Ela é modular e pode ser chamada para sincronizar diferentes tipos de dados.

**Endpoint:** `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/sync-ghl`

**Método:** `POST`

**Body (JSON):**
```json
{
  "sync_type": "all", // users, contacts, appointments, match, all
  "start_date": "2024-12-01T00:00:00Z", // Opcional
  "end_date": "2024-12-31T23:59:59Z"   // Opcional
}
```

### 🧠 Lógica de Match (CRM ↔ GTM)

O sistema faz um match inteligente entre as vendas do GTM e os leads do CRM:

1. **Busca por Nome Exato:** `"Ian Francio"` == `"ian francio"` (100% de confiança)
2. **Busca por Email:** `"ian@email.com"` == `"ian@email.com"` (100% de confiança)
3. **Busca por Telefone:** `"(11) 99999-9999"` == `"11999999999"` (100% de confiança)
4. **Busca por Similaridade (Fuzzy):** `"Ian Francio"` vs `"Ian F."` (85% de confiança)
   - Usa o algoritmo de Levenshtein
   - Apenas matches com >= 80% de confiança são considerados

### 🚀 Como Usar

#### **1. Configurar Variáveis de Ambiente**

No Supabase, vá em **Settings** → **Edge Functions** e adicione:

| Variável | Valor |
|----------|-------|
| `GHL_API_KEY` | Sua API Key do GoHighLevel |
| `GHL_LOCATION_ID` | Seu Location ID do GoHighLevel |

#### **2. Executar a Sincronização**

Você pode chamar a Edge Function via `curl` ou agendar para rodar periodicamente.

**Exemplo (curl):**
```bash
curl -X POST https://auvvrewlbpyymekonilv.supabase.co/functions/v1/sync-ghl \
  -H "Authorization: Bearer seu_supabase_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{"sync_type": "all"}'
```

#### **3. Agendar Sincronização (Cron Job)**

Para manter os dados atualizados, você pode criar um Cron Job no Supabase para chamar a função a cada hora:

1. Acesse: https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/database/cron
2. **New Job**
   - **Name:** `Sync GHL Data`
   - **Schedule:** `0 * * * *` (a cada hora)
   - **Function:** `sync-ghl`
   - **Body:** `{"sync_type": "all"}`

### 🗄️ Tabelas Criadas

| Tabela | Propósito |
|--------|-----------|
| `ghl_users` | Armazena vendedores |
| `ghl_contacts` | Armazena leads/contatos |
| `ghl_appointments` | Armazena agendamentos |
| `ghl_meetings` | Armazena reuniões realizadas |
| `crm_gtm_sync` | Armazena o resultado do match |

### 🔐 Segurança

- **API Key Segura:** A API Key do GHL fica segura nas variáveis de ambiente do Supabase.
- **RLS Policies:** Usuários autenticados podem ler os dados, mas apenas a Edge Function (com `service_role`) pode modificar.

### 📦 Commits

- `6e5fa44` - "feat: Integração completa com GoHighLevel CRM"

**Agora seu dashboard está enriquecido com dados do time comercial!** 📈🤝
