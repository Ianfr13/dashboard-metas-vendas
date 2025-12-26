#!/usr/bin/env python3
"""
Teste de Diagnóstico - Integração GoHighLevel
Testa operações básicas e fornece informações detalhadas sobre erros
"""

import requests
import json
from datetime import datetime

WEBHOOK_URL = "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/webhook-receiver"

def test_with_payload(test_name, payload, description):
    """Executa um teste e retorna informações detalhadas"""
    print(f"\n{'='*60}")
    print(f"TESTE: {test_name}")
    print(f"{'='*60}")
    print(f"Descrição: {description}")
    print(f"\nPayload enviado:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"\n📊 Resposta:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"  Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"  Body (text): {response.text[:500]}")
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response": response_data if 'response_data' in locals() else response.text
        }
        
    except requests.exceptions.Timeout:
        print(f"\n❌ TIMEOUT: Requisição demorou mais de 15 segundos")
        return {"success": False, "error": "timeout"}
    except Exception as e:
        print(f"\n❌ ERRO DE CONEXÃO: {str(e)}")
        return {"success": False, "error": str(e)}

def main():
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*15 + "TESTE DE DIAGNÓSTICO" + " "*23 + "║")
    print("║" + " "*12 + "Integração GoHighLevel" + " "*24 + "║")
    print("╚" + "="*58 + "╝")
    print(f"\nData/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Webhook URL: {WEBHOOK_URL}")
    
    results = []
    
    # Teste 1: Payload mínimo válido
    print("\n" + "🔍 "*20)
    result1 = test_with_payload(
        "1. Payload Mínimo Válido",
        {
            "type": "ContactCreate",
            "location_id": "test_loc",
            "id": "test_001",
            "webhookId": "diag_001"
        },
        "Testa com campos obrigatórios apenas"
    )
    results.append(("Payload Mínimo", result1))
    
    # Teste 2: Payload completo
    print("\n" + "🔍 "*20)
    result2 = test_with_payload(
        "2. Payload Completo",
        {
            "type": "ContactCreate",
            "location_id": "test_location_123",
            "id": "contact_diag_002",
            "webhookId": "diag_002",
            "name": "Maria Santos",
            "email": "maria@example.com",
            "phone": "+5511988888888",
            "tags": ["teste", "diagnóstico"]
        },
        "Testa com todos os campos populados"
    )
    results.append(("Payload Completo", result2))
    
    # Teste 3: Opportunity (para testar tabela ghl_opportunities)
    print("\n" + "🔍 "*20)
    result3 = test_with_payload(
        "3. OpportunityCreate",
        {
            "type": "OpportunityCreate",
            "location_id": "test_location_123",
            "id": "opp_diag_003",
            "webhookId": "diag_003",
            "name": "Venda Teste",
            "contact_id": "contact_001",
            "monetary_value": 100.00,
            "status": "open",
            "pipeline_id": "pipe_001",
            "pipeline_stage_id": "stage_001"
        },
        "Testa criação de oportunidade"
    )
    results.append(("OpportunityCreate", result3))
    
    # Resumo
    print("\n" + "="*60)
    print("📋 RESUMO DOS TESTES")
    print("="*60)
    
    for test_name, result in results:
        status = "✅ PASSOU" if result.get("success") else f"❌ FALHOU ({result.get('status_code', 'N/A')})"
        print(f"{test_name}: {status}")
        if not result.get("success") and "response" in result:
            print(f"  └─ Erro: {result['response']}")
    
    passed = sum(1 for _, r in results if r.get("success"))
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} testes passaram")
    
    if passed == 0:
        print("\n⚠️ NENHUM TESTE PASSOU")
        print("\n🔍 Possíveis causas:")
        print("  1. Variáveis de ambiente não configuradas (SUPABASE_URL, SERVICE_ROLE_KEY)")
        print("  2. Políticas RLS bloqueando operações")
        print("  3. Edge Function não foi deployada corretamente")
        print("  4. Migrations não aplicadas ou aplicadas incorretamente")
        print("\n💡 Próximo passo: Verificar logs da Edge Function no Supabase")
    elif passed < total:
        print("\n⚠️ ALGUNS TESTES FALHARAM")
        print("\n💡 Próximo passo: Analisar os erros específicos acima")
    else:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("\n✅ A integração está funcionando corretamente")
        print("✅ Pronto para executar testes de segurança")

if __name__ == "__main__":
    main()
