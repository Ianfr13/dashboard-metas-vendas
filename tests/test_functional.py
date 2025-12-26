#!/usr/bin/env python3
"""
Testes Funcionais - Integração GoHighLevel
"""

import requests
import json
import time
from datetime import datetime

WEBHOOK_URL = "https://auvvrewlbpyymekonilv.supabase.co/functions/v1/webhook-receiver"

def print_header(title):
    print("\n" + "="*60)
    print(title)
    print("="*60)

def test_opportunity_create():
    """FT-01: Teste de criação de oportunidade"""
    print_header("TESTE FT-01: OpportunityCreate")
    
    payload = {
        "type": "OpportunityCreate",
        "location_id": "test_location_123",
        "id": f"opp_test_{int(time.time())}",
        "webhookId": f"webhook_opp_create_{int(time.time())}",
        "name": "Oportunidade Teste",
        "pipelineId": "pipeline_123",
        "pipelineStageId": "stage_123",
        "contactId": "contact_123",
        "assignedTo": "user_123",
        "status": "open",
        "monetaryValue": 1500.00,
        "source": "website"
    }
    
    response = requests.post(WEBHOOK_URL, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ PASSOU")
        return True
    else:
        print("❌ FALHOU")
        return False

def test_opportunity_update():
    """FT-02: Teste de atualização de oportunidade"""
    print_header("TESTE FT-02: OpportunityUpdate")
    
    opp_id = f"opp_test_{int(time.time())}"
    
    # Criar primeiro
    payload_create = {
        "type": "OpportunityCreate",
        "location_id": "test_location_123",
        "id": opp_id,
        "webhookId": f"webhook_opp_create_{int(time.time())}",
        "name": "Oportunidade Original",
        "status": "open",
        "monetaryValue": 1000.00
    }
    requests.post(WEBHOOK_URL, json=payload_create)
    time.sleep(1)
    
    # Atualizar
    payload_update = {
        "type": "OpportunityUpdate",
        "location_id": "test_location_123",
        "id": opp_id,
        "webhookId": f"webhook_opp_update_{int(time.time())}",
        "name": "Oportunidade Atualizada",
        "status": "won",
        "monetaryValue": 2000.00
    }
    
    response = requests.post(WEBHOOK_URL, json=payload_update)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ PASSOU")
        return True
    else:
        print("❌ FALHOU")
        return False

def test_contact_create():
    """FT-03: Teste de criação de contato"""
    print_header("TESTE FT-03: ContactCreate")
    
    payload = {
        "type": "ContactCreate",
        "location_id": "test_location_123",
        "id": f"contact_test_{int(time.time())}",
        "webhookId": f"webhook_contact_create_{int(time.time())}",
        "name": "Maria Silva",
        "email": "maria.silva@example.com",
        "phone": "+5511988887777",
        "tags": ["lead", "interessado"]
    }
    
    response = requests.post(WEBHOOK_URL, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ PASSOU")
        return True
    else:
        print("❌ FALHOU")
        return False

def test_idempotency():
    """FT-04: Teste de idempotência"""
    print_header("TESTE FT-04: Idempotência")
    
    webhook_id = f"webhook_idempotency_{int(time.time())}"
    
    payload = {
        "type": "ContactCreate",
        "location_id": "test_location_123",
        "id": f"contact_idempotency_{int(time.time())}",
        "webhookId": webhook_id,
        "name": "Teste Idempotência"
    }
    
    # Primeira requisição
    response1 = requests.post(WEBHOOK_URL, json=payload)
    print(f"1ª Requisição - Status: {response1.status_code}")
    
    time.sleep(1)
    
    # Segunda requisição (mesma)
    response2 = requests.post(WEBHOOK_URL, json=payload)
    print(f"2ª Requisição - Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
    
    if response1.status_code == 200 and response2.status_code == 200:
        if "already processed" in response2.text.lower():
            print("✅ PASSOU - Idempotência funcionando")
            return True
    
    print("❌ FALHOU")
    return False

def test_invalid_payload():
    """FT-05: Teste de payload inválido"""
    print_header("TESTE FT-05: Payload Inválido (sem location_id)")
    
    payload = {
        "type": "ContactCreate",
        "id": "test_invalid"
        # Faltando location_id (obrigatório)
    }
    
    response = requests.post(WEBHOOK_URL, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 400:
        print("✅ PASSOU - Payload inválido rejeitado corretamente")
        return True
    else:
        print("❌ FALHOU")
        return False

def test_invalid_event_type():
    """FT-06: Teste de tipo de evento inválido"""
    print_header("TESTE FT-06: Tipo de Evento Inválido")
    
    payload = {
        "type": "InvalidEventType",
        "location_id": "test_location_123",
        "id": "test_invalid_type"
    }
    
    response = requests.post(WEBHOOK_URL, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 400:
        print("✅ PASSOU - Tipo inválido rejeitado corretamente")
        return True
    else:
        print("❌ FALHOU")
        return False

def main():
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*15 + "TESTES FUNCIONAIS" + " "*26 + "║")
    print("║" + " "*12 + "Integração GoHighLevel" + " "*24 + "║")
    print("╚" + "="*58 + "╝")
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    results.append(("FT-01: OpportunityCreate", test_opportunity_create()))
    time.sleep(2)
    
    results.append(("FT-02: OpportunityUpdate", test_opportunity_update()))
    time.sleep(2)
    
    results.append(("FT-03: ContactCreate", test_contact_create()))
    time.sleep(2)
    
    results.append(("FT-04: Idempotência", test_idempotency()))
    time.sleep(2)
    
    results.append(("FT-05: Payload Inválido", test_invalid_payload()))
    time.sleep(2)
    
    results.append(("FT-06: Tipo Inválido", test_invalid_event_type()))
    
    # Resumo
    print("\n" + "="*60)
    print("RESUMO DOS TESTES FUNCIONAIS")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{name}: {status}")
    
    print("="*60)
    print(f"Total: {passed}/{total} testes passaram ({passed/total*100:.0f}%)")
    print("="*60)
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES FUNCIONAIS PASSARAM!")
    else:
        print(f"\n⚠️ {total - passed} teste(s) falharam")

if __name__ == "__main__":
    main()
