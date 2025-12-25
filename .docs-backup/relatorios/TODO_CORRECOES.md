# TODO - Correções Dashboard Metas Vendas

## 🔴 FASE 1: RESOLVER BLOQUEADORES CRÍTICOS (PRIORIDADE MÁXIMA)

### 1.1 Corrigir Worker.ts (Resolver Looping de Deploy)

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 30 minutos  
**Arquivo**: `worker.ts`

**Problema**:
- Worker está em loop de deploy (4 commits em 10 minutos)
- `env.ASSETS` não está sendo validado corretamente
- Falta tratamento de erro robusto

**Ação**:
```typescript
// Substituir conteúdo completo do worker.ts por:

/**
 * Cloudflare Worker para SPA routing
 * Serve arquivos estáticos e faz fallback para index.html
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Validar se ASSETS está disponível
    if (!env.ASSETS) {
      console.error('ASSETS binding not configured');
      return new Response('Assets binding not configured', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Lista de extensões de arquivos estáticos
    const staticExtensions = [
      '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
      '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', 
      '.xml', '.txt', '.webp', '.avif', '.map'
    ];
    
    const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext));
    
    try {
      // Tentar buscar o arquivo primeiro
      const response = await env.ASSETS.fetch(request);
      
      // Se for arquivo estático e encontrou, retornar
      if (isStaticFile && response.status === 200) {
        return response;
      }
      
      // Se não é arquivo estático ou não encontrou (404), servir index.html
      if (!isStaticFile || response.status === 404) {
        const indexUrl = new URL('/index.html', url.origin);
        const indexRequest = new Request(indexUrl, {
          method: 'GET',
          headers: request.headers,
        });
        
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        
        // Garantir que retornamos HTML mesmo se index.html não for encontrado
        if (indexResponse.status === 404) {
          return new Response('Index.html not found', { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        return indexResponse;
      }
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};
```

**Verificação**:
- [ ] Código atualizado
- [ ] Testado localmente com `wrangler dev`
- [ ] Deploy realizado
- [ ] Verificar que não há mais loops

---

### 1.2 Atualizar wrangler.jsonc

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 10 minutos  
**Arquivo**: `wrangler.jsonc`

**Ação**:
```jsonc
{
  "name": "dashboard-metas-vendas",
  "compatibility_date": "2025-12-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "worker.ts",
  "assets": {
    "directory": "./dist/public",
    "binding": "ASSETS"
  },
  "build": {
    "command": "pnpm build"
  }
}
```

**Verificação**:
- [ ] Arquivo atualizado
- [ ] Build funciona localmente
- [ ] Deploy funciona

---

### 1.3 Migrar server/routes/goals.ts para Supabase

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 2 horas  
**Arquivo**: `server/routes/goals.ts`

**Problema**:
- 17 erros TypeScript
- Usa sintaxe Drizzle ORM incompatível com Supabase

**Ação**:
1. Remover import de `drizzle-orm`:
```typescript
// ❌ REMOVER
import { eq, and, gte, lte, sql } from "drizzle-orm";
```

2. Substituir todas as queries Drizzle por Supabase:

```typescript
// ❌ ANTES (Drizzle)
const result = await db.select().from(goals).where(and(...conditions));

// ✅ DEPOIS (Supabase)
const { data, error } = await db
  .from('goals')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate);

if (error) throw error;
```

```typescript
// ❌ ANTES (Drizzle)
await db.insert(goals).values({ name: 'Meta', value: 1000 });

// ✅ DEPOIS (Supabase)
const { data, error } = await db
  .from('goals')
  .insert({ name: 'Meta', value: 1000 })
  .select();

if (error) throw error;
```

```typescript
// ❌ ANTES (Drizzle)
await db.update(goals).set({ name: 'Nova Meta' }).where(eq(goals.id, goalId));

// ✅ DEPOIS (Supabase)
const { data, error } = await db
  .from('goals')
  .update({ name: 'Nova Meta' })
  .eq('id', goalId)
  .select();

if (error) throw error;
```

```typescript
// ❌ ANTES (Drizzle)
await db.delete(goals).where(eq(goals.id, goalId));

// ✅ DEPOIS (Supabase)
const { data, error } = await db
  .from('goals')
  .delete()
  .eq('id', goalId);

if (error) throw error;
```

**Verificação**:
- [ ] Todos os imports de drizzle-orm removidos
- [ ] Todas as queries migradas
- [ ] TypeScript check passa sem erros
- [ ] Testes manuais funcionam

---

### 1.4 Migrar server/routes/funis.ts para Supabase

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 1.5 horas  
**Arquivo**: `server/routes/funis.ts`

**Problema**:
- 10 erros TypeScript
- Mesma situação do goals.ts

**Ação**:
- Seguir mesmo padrão da migração do goals.ts
- Remover imports de drizzle-orm
- Substituir todas as queries

**Verificação**:
- [ ] Migração completa
- [ ] TypeScript check passa
- [ ] Testes funcionam

---

### 1.5 Migrar server/routes/funil-metricas.ts para Supabase

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 1 hora  
**Arquivo**: `server/routes/funil-metricas.ts`

**Problema**:
- 7 erros TypeScript

**Ação**:
- Seguir mesmo padrão de migração
- Remover imports de drizzle-orm
- Substituir queries

**Verificação**:
- [ ] Migração completa
- [ ] TypeScript check passa

---

### 1.6 Migrar server/routes/analytics.ts para Supabase

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 1 hora  
**Arquivo**: `server/routes/analytics.ts`

**Problema**:
- 5 erros TypeScript

**Ação**:
- Seguir mesmo padrão de migração

**Verificação**:
- [ ] Migração completa
- [ ] TypeScript check passa

---

### 1.7 Corrigir/Remover drizzle/schema.ts

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 15 minutos  
**Arquivo**: `drizzle/schema.ts`

**Problema**:
- 1 erro TypeScript
- Arquivo não deveria mais existir após migração para Supabase

**Ação**:
- **Opção 1 (Recomendada)**: Deletar o arquivo completamente
- **Opção 2**: Comentar todo o conteúdo e adicionar nota de deprecação

```typescript
// DEPRECATED: Este arquivo não é mais usado.
// O projeto migrou de Drizzle ORM para Supabase.
// Mantido apenas para referência histórica.
```

**Verificação**:
- [ ] Arquivo removido ou comentado
- [ ] Nenhum outro arquivo importa deste schema
- [ ] TypeScript check passa

---

### 1.8 Corrigir server/_core/sdk.ts

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🔴 CRÍTICA  
**Tempo estimado**: 30 minutos  
**Arquivo**: `server/_core/sdk.ts`

**Problema**:
- 1 erro TypeScript (linha 296)

**Ação**:
1. Identificar o erro específico
2. Corrigir sintaxe ou tipo
3. Verificar se não usa Drizzle ORM

**Verificação**:
- [ ] Erro corrigido
- [ ] TypeScript check passa

---

## 🟡 FASE 2: CORRIGIR FRONTEND

### 2.1 Corrigir client/src/components/AdminGoalsPanel.tsx

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 30 minutos  
**Arquivo**: `client/src/components/AdminGoalsPanel.tsx`

**Problema**:
- 1 erro TypeScript (linha 270)

**Ação**:
1. Abrir o arquivo e ir para linha 270
2. Identificar o erro específico
3. Corrigir tipo ou lógica

**Verificação**:
- [ ] Erro corrigido
- [ ] Componente renderiza corretamente
- [ ] TypeScript check passa

---

### 2.2 Corrigir client/src/pages/Home.tsx

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 30 minutos  
**Arquivo**: `client/src/pages/Home.tsx`

**Problema**:
- 2 erros TypeScript (linha 117)

**Ação**:
1. Abrir o arquivo e ir para linha 117
2. Identificar os erros específicos
3. Corrigir tipos ou lógica

**Verificação**:
- [ ] Erros corrigidos
- [ ] Página renderiza corretamente
- [ ] Dados do dashboard carregam
- [ ] TypeScript check passa

---

## 🟢 FASE 3: LIMPEZA E OTIMIZAÇÃO

### 3.1 Remover Dependências Desnecessárias

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟢 MÉDIA  
**Tempo estimado**: 15 minutos  
**Arquivo**: `package.json`

**Ação**:
```bash
# Remover mysql2
pnpm remove mysql2

# Remover drizzle-kit
pnpm remove -D drizzle-kit
```

**Verificação**:
- [ ] Dependências removidas
- [ ] `pnpm install` funciona
- [ ] Build funciona
- [ ] Nenhum código importa estas bibliotecas

---

### 3.2 Limpar Arquivos do Drizzle

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟢 MÉDIA  
**Tempo estimado**: 20 minutos

**Ação**:
```bash
# Mover para backup (não deletar imediatamente)
mkdir -p .backup/drizzle
mv drizzle/schema.ts .backup/drizzle/
mv drizzle/relations.ts .backup/drizzle/
mv drizzle.config.ts .backup/

# Após confirmar que tudo funciona, deletar:
# rm -rf .backup/
```

**Verificação**:
- [ ] Arquivos movidos para backup
- [ ] Build funciona
- [ ] Testes funcionam
- [ ] Após 1 semana sem problemas, deletar backup

---

### 3.3 Atualizar Scripts de Build

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟢 MÉDIA  
**Tempo estimado**: 15 minutos  
**Arquivo**: `package.json`

**Ação**:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build",
    "build:server": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "build:cloudflare": "vite build",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run",
    "deploy:functions": "./deploy-functions.sh",
    "preview": "vite preview"
  }
}
```

**Verificação**:
- [ ] Scripts atualizados
- [ ] `pnpm build` funciona
- [ ] `pnpm build:cloudflare` funciona
- [ ] `pnpm check` passa

---

### 3.4 Atualizar Documentação

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟢 MÉDIA  
**Tempo estimado**: 1 hora

**Ação**:
1. Atualizar `README.md` com instruções corretas
2. Atualizar `todo.md` com status atual
3. Criar `MIGRATION_COMPLETE.md` documentando a migração
4. Atualizar `DEPLOY_GUIDE.md` com processo correto

**Verificação**:
- [ ] README atualizado
- [ ] TODO atualizado
- [ ] Documentação de migração criada
- [ ] Guia de deploy atualizado

---

## 🧪 FASE 4: TESTES E VALIDAÇÃO

### 4.1 Testes Locais

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 1 hora

**Checklist**:
- [ ] `pnpm install` sem erros
- [ ] `pnpm check` passa sem erros TypeScript
- [ ] `pnpm build` gera dist/public corretamente
- [ ] `pnpm dev` inicia servidor local
- [ ] Frontend carrega no navegador
- [ ] Login com Google funciona
- [ ] Dashboard carrega dados
- [ ] Página de Admin funciona
- [ ] Página de Métricas funciona
- [ ] Página de Ranking funciona

---

### 4.2 Testes do Worker Localmente

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 30 minutos

**Ação**:
```bash
# Instalar Wrangler se necessário
pnpm add -D wrangler

# Testar worker localmente
pnpm wrangler dev

# Testar rotas:
# - http://localhost:8787/ (deve servir index.html)
# - http://localhost:8787/admin (deve servir index.html)
# - http://localhost:8787/assets/index.js (deve servir arquivo JS)
```

**Checklist**:
- [ ] Worker inicia sem erros
- [ ] Rota raiz (/) funciona
- [ ] Rotas SPA (/admin, /metricas) funcionam
- [ ] Arquivos estáticos (.js, .css) carregam
- [ ] Não há erros no console

---

### 4.3 Deploy para Staging/Produção

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 30 minutos

**Ação**:
```bash
# Build de produção
pnpm build:cloudflare

# Deploy via Wrangler
pnpm wrangler pages deploy dist/public --project-name=dashboard-metas-vendas

# Ou via Git (se conectado ao Cloudflare Pages)
git add .
git commit -m "fix: corrigir worker e migrar para Supabase completamente"
git push origin main
```

**Checklist**:
- [ ] Build de produção sem erros
- [ ] Deploy realizado com sucesso
- [ ] URL de produção acessível
- [ ] Todas as páginas funcionam
- [ ] Autenticação funciona
- [ ] Dados carregam corretamente
- [ ] Sem erros no console do navegador
- [ ] Sem loops de deploy

---

### 4.4 Monitoramento Pós-Deploy

**Status**: ❌ NÃO INICIADO  
**Prioridade**: 🟡 ALTA  
**Tempo estimado**: 24 horas (monitoramento)

**Ação**:
1. Monitorar logs do Cloudflare Workers
2. Monitorar logs do Supabase Edge Functions
3. Verificar métricas de erro
4. Testar em diferentes navegadores
5. Testar em dispositivos móveis

**Checklist**:
- [ ] Sem erros nos logs (primeiras 2 horas)
- [ ] Performance aceitável (< 2s load time)
- [ ] Funciona em Chrome, Firefox, Safari
- [ ] Funciona em mobile
- [ ] Sem loops de deploy
- [ ] Sem erros 500

---

## 📊 RESUMO DE PROGRESSO

### Estatísticas

- **Total de tarefas**: 23
- **Concluídas**: 0
- **Em progresso**: 0
- **Não iniciadas**: 23

### Por Prioridade

- 🔴 **Críticas**: 8 tarefas (Fase 1)
- 🟡 **Altas**: 6 tarefas (Fase 2 + Testes)
- 🟢 **Médias**: 9 tarefas (Fase 3 + Documentação)

### Tempo Estimado Total

- **Fase 1**: ~7 horas
- **Fase 2**: ~1 hora
- **Fase 3**: ~2 horas
- **Fase 4**: ~3 horas
- **TOTAL**: ~13 horas de trabalho

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Dia 1 (4-5 horas)
1. ✅ Corrigir worker.ts (30 min)
2. ✅ Atualizar wrangler.jsonc (10 min)
3. ✅ Migrar goals.ts (2h)
4. ✅ Migrar funis.ts (1.5h)
5. ✅ Testar TypeScript check

### Dia 2 (4-5 horas)
6. ✅ Migrar funil-metricas.ts (1h)
7. ✅ Migrar analytics.ts (1h)
8. ✅ Corrigir schema.ts (15 min)
9. ✅ Corrigir sdk.ts (30 min)
10. ✅ Corrigir AdminGoalsPanel.tsx (30 min)
11. ✅ Corrigir Home.tsx (30 min)
12. ✅ Testar TypeScript check completo

### Dia 3 (3-4 horas)
13. ✅ Remover dependências antigas (15 min)
14. ✅ Limpar arquivos Drizzle (20 min)
15. ✅ Atualizar scripts (15 min)
16. ✅ Testes locais completos (1h)
17. ✅ Testes do worker (30 min)
18. ✅ Deploy para produção (30 min)
19. ✅ Monitoramento inicial (1h)

### Dia 4 (2 horas)
20. ✅ Atualizar documentação (1h)
21. ✅ Verificar monitoramento (30 min)
22. ✅ Testes finais (30 min)
23. ✅ Marcar projeto como estável ✅

---

## 🚨 AVISOS IMPORTANTES

### ⚠️ Antes de Começar

1. **Fazer backup do repositório**:
```bash
git tag backup-antes-correcoes-$(date +%Y%m%d)
git push origin --tags
```

2. **Criar branch de desenvolvimento**:
```bash
git checkout -b fix/migracao-supabase-completa
```

3. **Não fazer deploy direto na main** até tudo estar testado

### ⚠️ Durante a Execução

1. **Fazer commits pequenos e frequentes**
2. **Testar após cada migração de arquivo**
3. **Manter o TypeScript check rodando**
4. **Documentar problemas encontrados**

### ⚠️ Após Conclusão

1. **Monitorar logs por 48 horas**
2. **Manter backup por 1 semana**
3. **Atualizar documentação com lições aprendidas**
4. **Criar testes automatizados para prevenir regressões**

---

## 📝 NOTAS ADICIONAIS

### Comandos Úteis

```bash
# Verificar erros TypeScript
pnpm check

# Build local
pnpm build

# Testar worker localmente
pnpm wrangler dev

# Ver logs do Cloudflare
pnpm wrangler tail

# Deploy manual
pnpm wrangler pages deploy dist/public

# Verificar status do Supabase
# (via Supabase Dashboard)
```

### Links Importantes

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Repositório GitHub**: https://github.com/Ianfr13/dashboard-metas-vendas
- **Documentação Supabase JS**: https://supabase.com/docs/reference/javascript
- **Documentação Cloudflare Workers**: https://developers.cloudflare.com/workers

---

**Criado em**: 24 de dezembro de 2024  
**Última atualização**: 24 de dezembro de 2024  
**Status geral**: 🔴 Crítico - Requer ação imediata  
**Responsável**: A definir
