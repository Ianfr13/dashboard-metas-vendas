#!/bin/bash

# Script de Deploy Seguro para Edge Functions
# Sempre usa o projeto correto: auvvrewlbpyymekonilv (dashboard)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="auvvrewlbpyymekonilv"
PROJECT_NAME="dashboard"

echo -e "${GREEN}🚀 Deploy de Edge Functions - Projeto: ${PROJECT_NAME}${NC}"
echo -e "${YELLOW}Project Ref: ${PROJECT_REF}${NC}"
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ ERRO: SUPABASE_ACCESS_TOKEN não está configurado${NC}"
    echo "Configure com: export SUPABASE_ACCESS_TOKEN=seu_token"
    exit 1
fi

# Link to the correct project
echo -e "${YELLOW}📎 Linkando ao projeto correto...${NC}"
supabase link --project-ref $PROJECT_REF

# Get function name from argument or deploy all
FUNCTION_NAME=$1

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${YELLOW}📦 Fazendo deploy de TODAS as Edge Functions...${NC}"
    supabase functions deploy
else
    echo -e "${YELLOW}📦 Fazendo deploy da função: ${FUNCTION_NAME}${NC}"
    supabase functions deploy $FUNCTION_NAME
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🔗 Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}/functions${NC}"
