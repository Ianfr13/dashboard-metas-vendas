import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  Percent
} from 'lucide-react';
// tRPC removido - cálculos agora são feitos localmente
import { toast } from 'sonner';

interface MetricsSimulatorProps {
  scenario: '3M' | '4M' | '5M';
}

export function MetricsSimulator({ scenario }: MetricsSimulatorProps) {
  // Valores padrão
  const [targetRevenue, setTargetRevenue] = useState(() => {
    const revenues = { '3M': 3000000, '4M': 4000000, '5M': 5000000 };
    return revenues[scenario];
  });

  const [vslConversionRate, setVslConversionRate] = useState(1.5);
  const [checkoutConversionRate, setCheckoutConversionRate] = useState(80);
  const [upsellConversionRate, setUpsellConversionRate] = useState(25);
  const [targetCPA, setTargetCPA] = useState(450);
  const [targetCPL, setTargetCPL] = useState(30);
  const [avgCTR, setAvgCTR] = useState(3);
  const [frontTicket, setFrontTicket] = useState(797);
  const [upsellTicket, setUpsellTicket] = useState(247);

  // Atualizar targetRevenue quando cenário mudar
  useEffect(() => {
    const revenues = { '3M': 3000000, '4M': 4000000, '5M': 5000000 };
    setTargetRevenue(revenues[scenario]);
  }, [scenario]);

  // Cálculos feitos localmente (não precisa mais de backend)

  const [calculatedMetrics, setCalculatedMetrics] = useState<any>(null);

  const handleCalculate = () => {
    try {
      // Cálculo local das métricas
      const avgTicket = frontTicket + (upsellTicket * (upsellConversionRate / 100));
      const requiredSales = Math.ceil(targetRevenue / avgTicket);
      const requiredLeads = Math.ceil(requiredSales / (checkoutConversionRate / 100));
      const requiredViews = Math.ceil(requiredLeads / (vslConversionRate / 100));
      const requiredClicks = Math.ceil(requiredViews / (avgCTR / 100));
      const trafficInvestment = requiredLeads * targetCPL;
      const expectedRevenue = requiredSales * avgTicket;
      const roi = ((expectedRevenue - trafficInvestment) / trafficInvestment) * 100;
      const roas = expectedRevenue / trafficInvestment;

      const result = {
        requiredViews,
        requiredLeads,
        requiredClicks,
        requiredSales,
        trafficInvestment,
        expectedRevenue,
        roi,
        roas,
        avgTicket,
      };

      setCalculatedMetrics(result);
      toast.success('Métricas calculadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao calcular métricas');
      console.error(error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  return (
    <div className="space-y-6">
      {/* Inputs de Simulação */}
      <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-[#00a67d]" />
          <h3 className="text-lg font-semibold text-white">Parâmetros de Simulação</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Meta de Receita */}
          <div className="space-y-2">
            <Label htmlFor="targetRevenue" className="text-white/70 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Meta de Receita
            </Label>
            <Input
              id="targetRevenue"
              type="number"
              value={targetRevenue}
              onChange={(e) => setTargetRevenue(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Conversão VSL */}
          <div className="space-y-2">
            <Label htmlFor="vslConversion" className="text-white/70 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Conversão VSL (%)
            </Label>
            <Input
              id="vslConversion"
              type="number"
              step="0.1"
              value={vslConversionRate}
              onChange={(e) => setVslConversionRate(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Conversão Checkout */}
          <div className="space-y-2">
            <Label htmlFor="checkoutConversion" className="text-white/70 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Conversão Checkout (%)
            </Label>
            <Input
              id="checkoutConversion"
              type="number"
              step="0.1"
              value={checkoutConversionRate}
              onChange={(e) => setCheckoutConversionRate(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Conversão Upsell */}
          <div className="space-y-2">
            <Label htmlFor="upsellConversion" className="text-white/70 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Conversão Upsell (%)
            </Label>
            <Input
              id="upsellConversion"
              type="number"
              step="0.1"
              value={upsellConversionRate}
              onChange={(e) => setUpsellConversionRate(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* CPA Alvo */}
          <div className="space-y-2">
            <Label htmlFor="targetCPA" className="text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              CPA Alvo (R$)
            </Label>
            <Input
              id="targetCPA"
              type="number"
              value={targetCPA}
              onChange={(e) => setTargetCPA(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* CPL Alvo */}
          <div className="space-y-2">
            <Label htmlFor="targetCPL" className="text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              CPL Alvo (R$)
            </Label>
            <Input
              id="targetCPL"
              type="number"
              value={targetCPL}
              onChange={(e) => setTargetCPL(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* CTR Médio */}
          <div className="space-y-2">
            <Label htmlFor="avgCTR" className="text-white/70 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              CTR Médio (%)
            </Label>
            <Input
              id="avgCTR"
              type="number"
              step="0.1"
              value={avgCTR}
              onChange={(e) => setAvgCTR(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Ticket Front */}
          <div className="space-y-2">
            <Label htmlFor="frontTicket" className="text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ticket Front (R$)
            </Label>
            <Input
              id="frontTicket"
              type="number"
              value={frontTicket}
              onChange={(e) => setFrontTicket(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Ticket Upsell */}
          <div className="space-y-2">
            <Label htmlFor="upsellTicket" className="text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ticket Upsell (R$)
            </Label>
            <Input
              id="upsellTicket"
              type="number"
              value={upsellTicket}
              onChange={(e) => setUpsellTicket(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={false}
          className="mt-6 w-full md:w-auto bg-[#00a67d] hover:bg-[#00a67d]/80 text-white"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Métricas
        </Button>
      </Card>

      {/* Resultados Calculados */}
      {calculatedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vendas Necessárias */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-[#00a67d]" />
              <span className="text-xs text-white/50">VENDAS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(calculatedMetrics.requiredSales)}
            </div>
            <div className="text-xs text-white/50 mt-1">vendas necessárias</div>
          </Card>

          {/* Leads Necessários */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-[#418ecb]" />
              <span className="text-xs text-white/50">LEADS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(calculatedMetrics.requiredLeads)}
            </div>
            <div className="text-xs text-white/50 mt-1">leads necessários</div>
          </Card>

          {/* Views Necessários */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-[#5a4b99]" />
              <span className="text-xs text-white/50">VIEWS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(calculatedMetrics.requiredViews)}
            </div>
            <div className="text-xs text-white/50 mt-1">views na VSL</div>
          </Card>

          {/* Clicks Necessários */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <MousePointerClick className="w-5 h-5 text-[#efd565]" />
              <span className="text-xs text-white/50">CLICKS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatNumber(calculatedMetrics.requiredClicks)}
            </div>
            <div className="text-xs text-white/50 mt-1">clicks necessários</div>
          </Card>

          {/* Investimento em Tráfego */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-[#00a67d]" />
              <span className="text-xs text-white/50">INVESTIMENTO</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(calculatedMetrics.trafficInvestment)}
            </div>
            <div className="text-xs text-white/50 mt-1">em tráfego</div>
          </Card>

          {/* Ticket Médio */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-[#efd565]" />
              <span className="text-xs text-white/50">TICKET MÉDIO</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(calculatedMetrics.avgTicket)}
            </div>
            <div className="text-xs text-white/50 mt-1">por venda</div>
          </Card>

          {/* ROI */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-[#00a67d]" />
              <span className="text-xs text-white/50">ROI</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(calculatedMetrics.roi || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-white/50 mt-1">retorno sobre investimento</div>
          </Card>

          {/* ROAS */}
          <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-[#418ecb]" />
              <span className="text-xs text-white/50">ROAS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(calculatedMetrics.roas || 0).toFixed(2)}x
            </div>
            <div className="text-xs text-white/50 mt-1">retorno por real investido</div>
          </Card>
        </div>
      )}
    </div>
  );
}
