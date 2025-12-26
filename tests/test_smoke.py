#!/usr/bin/env python3
"""
Teste Smoke - Integração GoHighLevel
Testa o funcionamento básico do webhook
"""

import requests
import json
from datetime import datetime

WEBHOOK_URL = "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/webhook-receiver"

def test_smoke():
    """ST-05: Smoke Test - Primeiro Webhook"""
    print("=" * 60)
    print("TESTE ST-05: Smoke Test - Primeiro Webhook")
    print("=" * 60)
    print(f"URL: {WEBHOOK_URL}")
    print()
    
    payload = {
        "type": "ContactCreate",
        "location_id": "test_location_123",
        "id": "contact_smoke_test",
        "webhookId": "webhook_smoke_test",
        "name": "João Silva - Teste",
        "email": "joao.teste@example.com",
        "phone": "+5511999999999"
    }
    
    print("Enviando webhook...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json() if response.headers.get('content-type') == 'application/json' else response.text, indent=2)}")
        print()
        
        if response.status_code == 200:
            print("✅ TESTE PASSOU: Webhook recebido com sucesso!")
            return True
        else:
            print(f"❌ TESTE FALHOU: Status esperado 200, recebido {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TESTE FALHOU: Timeout ao enviar webhook")
        return False
    except Exception as e:
        print(f"❌ TESTE FALHOU: Erro ao enviar webhook: {str(e)}")
        return False

if __name__ == "__main__":
    print()
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 18 + "TESTE SMOKE - WEBHOOK" + " " * 19 + "║")
    print("║" + " " * 15 + "Integração GoHighLevel" + " " * 21 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    result = test_smoke()
    
    print()
    print("=" * 60)
    if result:
        print("🎉 TESTE SMOKE PASSOU!")
        print()
        print("Próximos passos:")
        print("1. Verificar logs no Supabase")
        print("2. Executar testes funcionais")
        print("3. Executar testes de segurança")
    else:
        print("⚠️ TESTE SMOKE FALHOU")
        print()
        print("Verifique:")
        print("1. Edge Function foi deployada?")
        print("2. Variáveis de ambiente configuradas?")
        print("3. Migrations aplicadas?")
    print("=" * 60)
