#!/bin/bash

# Script de Deploy da Edge Function get-funnel-metrics
# Uso: ./deploy-edge-function.sh

set -e

echo "🚀 Deploy da Edge Function: get-funnel-metrics"
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo ""
    echo "Instale com:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase!"
    echo ""
    echo "Faça login com:"
    echo "  supabase login"
    echo ""
    exit 1
fi

# Verificar se está linkado ao projeto
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Projeto não está linkado!"
    echo ""
    echo "Link ao projeto com:"
    echo "  supabase link --project-ref SEU_PROJECT_REF"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Fazendo deploy da função..."
echo ""

# Deploy da função
supabase functions deploy get-funnel-metrics

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy realizado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "  1. Teste a função:"
    echo "     supabase functions invoke get-funnel-metrics --data '{\"month\":12,\"year\":2025,\"funnel\":\"marketing\"}'"
    echo ""
    echo "  2. Ou via curl:"
    echo "     curl -X GET 'https://SEU_PROJECT_REF.supabase.co/functions/v1/get-funnel-metrics?month=12&year=2025&funnel=marketing' \\"
    echo "       -H \"Authorization: Bearer SEU_ANON_KEY\""
    echo ""
else
    echo ""
    echo "❌ Erro no deploy!"
    echo ""
    exit 1
fi
