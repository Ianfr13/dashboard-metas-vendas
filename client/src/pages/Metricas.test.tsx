import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Metricas from './Metricas';

// Mock the child components
vi.mock('@/components/metrics/AdvancedFunnel', () => ({
  default: ({ data }: any) => (
    <div data-testid="advanced-funnel">
      AdvancedFunnel: {data?.purchases} purchases
    </div>
  ),
}));

vi.mock('@/components/metrics/TrafficSourcesTable', () => ({
  default: () => <div data-testid="traffic-sources-table">TrafficSourcesTable</div>,
}));

vi.mock('@/components/metricas/FunisCadastrados', () => ({
  default: () => <div data-testid="funis-cadastrados">FunisCadastrados</div>,
}));

vi.mock('@/components/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/lib/edge-functions', () => ({
  gtmAnalyticsAPI: {
    getFunnelMetrics: vi.fn(),
    getEvolutionChart: vi.fn(),
    getProductMetrics: vi.fn(),
    getTrafficSources: vi.fn(),
  },
}));

vi.mock('@/lib/ranking-api', () => ({
  rankingAPI: {
    getMetrics: vi.fn().mockResolvedValue({
      ligacoes_realizadas: 10,
      total_agendamentos: 5,
      taxa_conversao_agendamentos: 50,
      agendamentos_qualificados: 3,
      tempo_medio_resposta: 15,
      no_shows: 1,
      total_vendas: 2,
      faturamento_total: 5000,
      taxa_conversao_geral: 20,
      ticket_medio: 2500,
      taxa_nao_comparecimento: 10,
      follow_ups: 8,
    }),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

import { gtmAnalyticsAPI } from '@/lib/edge-functions';
import { rankingAPI } from '@/lib/ranking-api';

describe('Metricas', () => {
  const mockFunnelData = {
    etapas: {
      pageViews: 5000,
      leads: 500,
      viewItem: 400,
      addToCart: 200,
      beginCheckout: 150,
      checkouts: 100,
      purchases: 50,
    },
    conversao: {
      viewsParaLeads: 10,
      leadsParaCheckout: 20,
      checkoutParaVenda: 50,
    },
    financeiro: {
      receitaTotal: 125000,
      ticketMedio: 2500,
    },
  };

  const mockEvolutionData = [
    { date: '2024-12-01', count: 10 },
    { date: '2024-12-02', count: 15 },
    { date: '2024-12-03', count: 12 },
  ];

  const mockProductData = [
    { produto: 'Produto A', vendas: 25, receita: 62500, ticketMedio: 2500 },
    { produto: 'Produto B', vendas: 15, receita: 37500, ticketMedio: 2500 },
    { produto: 'Produto C', vendas: 10, receita: 25000, ticketMedio: 2500 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (gtmAnalyticsAPI.getFunnelMetrics as any).mockResolvedValue(mockFunnelData);
    (gtmAnalyticsAPI.getEvolutionChart as any).mockResolvedValue(mockEvolutionData);
    (gtmAnalyticsAPI.getProductMetrics as any).mockResolvedValue(mockProductData);
    (gtmAnalyticsAPI.getTrafficSources as any).mockResolvedValue([]);
    (rankingAPI.getMetrics as any).mockResolvedValue({
      ligacoes_realizadas: 10,
      total_vendas: 2
    });
  });

  describe('Component Rendering', () => {
    it('should render the metrics page with dashboard layout', async () => {
      render(<Metricas />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Período de Análise')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockImplementation(() => new Promise(() => { }));

      render(<Metricas />);

      expect(screen.getByText('Carregando métricas...')).toBeInTheDocument();
    });

    it('should render date filters', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText('Data Inicial')).toBeInTheDocument();
        expect(screen.getByText('Data Final')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all tab triggers', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Marketing/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Produtos/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Comercial/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Funis/i })).toBeInTheDocument();
      });
    });

    it('should switch to Marketing tab (default)', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByTestId('advanced-funnel')).toBeInTheDocument();
        expect(screen.getByTestId('traffic-sources-table')).toBeInTheDocument();
      });
    });

    it('should switch to Funis tab', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funis/i })).toBeInTheDocument();
      });

      const funisTab = screen.getByRole('tab', { name: /Funis/i });
      await user.click(funisTab);

      await waitFor(() => {
        expect(screen.getByTestId('funis-cadastrados')).toBeInTheDocument();
      });
    });

    it('should switch to Comercial tab', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Comercial/i })).toBeInTheDocument();
      });

      const comercialTab = screen.getByRole('tab', { name: /Comercial/i });
      await user.click(comercialTab);

      await waitFor(() => {
        // Expect Commercial filters or cards
        expect(screen.getByText('Métricas Comerciais')).toBeInTheDocument();
        expect(screen.getByText('Função')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch all metrics on mount', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(gtmAnalyticsAPI.getFunnelMetrics).toHaveBeenCalled();
        expect(gtmAnalyticsAPI.getEvolutionChart).toHaveBeenCalled();
        expect(gtmAnalyticsAPI.getProductMetrics).toHaveBeenCalled();
      });
    });

    it('should call APIs with correct date parameters', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(gtmAnalyticsAPI.getFunnelMetrics).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          expect.stringMatching(/\d{4}-\d{2}-\d{2}/)
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockRejectedValue(new Error('API Error'));

      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar métricas/i)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Marketing Tab', () => {
    it('should display funnel metrics', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText('Visualizações')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });
  });

  describe('Products Tab', () => {
    it('should display product metrics', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await user.click(await screen.findByRole('tab', { name: /Produtos/i }));

      await waitFor(() => {
        expect(screen.getByText('Produto A')).toBeInTheDocument();
        expect(screen.getByText('Produto B')).toBeInTheDocument();
      });
    });
  });
});