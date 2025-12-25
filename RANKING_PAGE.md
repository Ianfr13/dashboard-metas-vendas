## 🏆 Página de Ranking do Time Comercial

Nova página criada para visualizar o desempenho do time de vendas com ranking de closers e SDRs.

### 🎯 Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Melhor Closer** | Card destacado com o vendedor que mais fechou vendas |
| **Melhor SDR** | Card destacado com o SDR que mais agendou reuniões |
| **Ranking de Closers** | Tabela completa com todos os closers ordenados por valor de vendas |
| **Ranking de SDRs** | Tabela completa com todos os SDRs ordenados por agendamentos |
| **Filtro de Período** | Seletor de data para visualizar ranking em períodos específicos |
| **Atualização Manual** | Botão para forçar atualização dos dados |

### 📊 Métricas Exibidas

#### **Para Closers:**
- Número de vendas
- Valor total vendido (R$)
- Taxa de conversão (%)
- Número de agendamentos

#### **Para SDRs:**
- Número de agendamentos
- Número de reuniões realizadas
- Vendas geradas (se houver)

### 🏗️ Arquitetura

```
Frontend (React)
      ↓
useTeamRanking Hook (React Query)
      ↓
Edge Function: team-ranking
      ↓
Supabase Database
  - ghl_users
  - ghl_contacts
  - ghl_appointments
  - ghl_meetings
  - crm_gtm_sync
```

### 🔧 Componentes Criados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/team-ranking/index.ts` | Edge Function que calcula métricas do time |
| `client/src/pages/Ranking.tsx` | Página principal de ranking |
| `client/src/components/Ranking/TopPerformerCard.tsx` | Card para melhor vendedor |
| `client/src/components/Ranking/RankingTable.tsx` | Tabela de ranking completa |
| `client/src/hooks/useTeamRanking.ts` | Hook React Query para dados |

### 🤖 Edge Function: `team-ranking`

**Endpoint:** `https://auvvrewlbpyymekonilv.supabase.co/functions/v1/team-ranking`

**Método:** `POST`

**Body (JSON):**
```json
{
  "start_date": "2024-12-01T00:00:00Z",  // Opcional (padrão: últimos 30 dias)
  "end_date": "2024-12-31T23:59:59Z"     // Opcional (padrão: hoje)
}
```

**Response:**
```json
{
  "best_closer": {
    "id": "user123",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "Closer",
    "sales_count": 25,
    "sales_value": 150000.00,
    "meetings_count": 30,
    "appointments_count": 35,
    "conversion_rate": 71.43
  },
  "best_sdr": {
    "id": "user456",
    "name": "Maria Santos",
    "email": "maria@example.com",
    "role": "SDR",
    "sales_count": 0,
    "sales_value": 0,
    "meetings_count": 45,
    "appointments_count": 50,
    "conversion_rate": 0
  },
  "closers": [...],
  "sdrs": [...],
  "period": {
    "start_date": "2024-12-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z"
  }
}
```

### 🎨 Interface

A página possui:

1. **Header com Filtros**
   - Título e descrição
   - Seletor de período (date range picker)
   - Botão de atualizar

2. **Cards de Destaque**
   - Melhor Closer (esquerda)
   - Melhor SDR (direita)
   - Design com borda destacada e gradiente

3. **Tabs de Ranking**
   - Tab "Closers" com tabela de vendedores
   - Tab "SDRs" com tabela de agendadores
   - Ícones de troféu para top 3

4. **Tabela de Ranking**
   - Posição com ícones (🏆 1º, 🥈 2º, 🥉 3º)
   - Nome e email do vendedor
   - Cargo (badge)
   - Métricas específicas por tipo

### 🔐 Segurança

- **RLS Policies:** Todos os usuários autenticados podem ler os dados
- **Cache:** React Query mantém cache de 5 minutos
- **Service Role:** Edge Function usa service_role para acesso completo

### 🚀 Como Usar

#### **1. Executar a Migração SQL**

Se ainda não executou, rode o arquivo `supabase/ghl_tables.sql` no Supabase SQL Editor:
https://supabase.com/dashboard/project/auvvrewlbpyymekonilv/sql/new

#### **2. Deploy da Edge Function**

```bash
cd ~/dashboard-metas-vendas
./deploy-functions.sh team-ranking
```

#### **3. Acessar a Página**

Navegue para: `https://seu-dominio.com/ranking`

Ou clique no menu lateral: **🏆 Ranking**

### 📱 Responsividade

- **Desktop:** Grid de 2 colunas para cards de destaque
- **Mobile:** Cards empilhados verticalmente
- **Tabela:** Scroll horizontal em telas pequenas
- **Menu:** Sidebar colapsável

### 🎯 Lógica de Separação

A Edge Function separa automaticamente closers e SDRs:

1. **Por Role:** Se o campo `role` contém "closer", "vendedor", "sdr" ou "agendador"
2. **Por Performance:** Se não houver role definido:
   - Usuários com mais vendas = Closers
   - Usuários com mais agendamentos = SDRs

### 📦 Commit

- `299b006` - "feat: Adicionar página de ranking do time comercial"

**Agora você tem uma página completa de ranking do time!** 🏆📈
