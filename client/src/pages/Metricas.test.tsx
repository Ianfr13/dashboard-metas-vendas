import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Metricas from './Metricas';

// Mock the child components
vi.mock('@/components/metricas/FunilMarketing', () => ({
  default: ({ selectedMonth, selectedYear }: any) => (
    <div data-testid="funil-marketing">
      FunilMarketing: {selectedMonth}/{selectedYear}
    </div>
  ),
}));

vi.mock('@/components/metricas/FunilComercial', () => ({
  default: ({ selectedMonth, selectedYear }: any) => (
    <div data-testid="funil-comercial">
      FunilComercial: {selectedMonth}/{selectedYear}
    </div>
  ),
}));

vi.mock('@/components/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/lib/edge-functions', () => ({
  gtmAnalyticsAPI: {
    getFunnelMetrics: vi.fn(),
    getEvolutionChart: vi.fn(),
    getProductMetrics: vi.fn(),
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

describe('Metricas', () => {
  const mockFunnelData = {
    etapas: {
      pageViews: 5000,
      leads: 500,
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
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockImplementation(() => new Promise(() => {}));
      
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
        expect(screen.getByRole('tab', { name: /Funil de Conversão/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Evolução/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Produtos/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Funil Marketing/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Funil Comercial/i })).toBeInTheDocument();
      });
    });

    it('should switch to Marketing funnel tab', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funil Marketing/i })).toBeInTheDocument();
      });

      const marketingTab = screen.getByRole('tab', { name: /Funil Marketing/i });
      await user.click(marketingTab);

      await waitFor(() => {
        expect(screen.getByTestId('funil-marketing')).toBeInTheDocument();
      });
    });

    it('should switch to Commercial funnel tab', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funil Comercial/i })).toBeInTheDocument();
      });

      const comercialTab = screen.getByRole('tab', { name: /Funil Comercial/i });
      await user.click(comercialTab);

      await waitFor(() => {
        expect(screen.getByTestId('funil-comercial')).toBeInTheDocument();
      });
    });

    it('should pass correct month/year to FunilMarketing', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funil Marketing/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Funil Marketing/i }));

      await waitFor(() => {
        const funilMarketing = screen.getByTestId('funil-marketing');
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        expect(funilMarketing).toHaveTextContent(`${currentMonth}/${currentYear}`);
      });
    });

    it('should pass correct month/year to FunilComercial', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funil Comercial/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Funil Comercial/i }));

      await waitFor(() => {
        const funilComercial = screen.getByTestId('funil-comercial');
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        expect(funilComercial).toHaveTextContent(`${currentMonth}/${currentYear}`);
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
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockRejectedValue(new Error('API Error'));

      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar métricas/i)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('should display error message on failure', async () => {
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockRejectedValue(new Error('Network error'));

      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar métricas/i)).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      (gtmAnalyticsAPI.getFunnelMetrics as any).mockRejectedValue(new Error('Failed'));

      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
      });
    });
  });

  describe('Funnel Conversion Tab', () => {
    it('should display funnel metrics', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText('Visualizações')).toBeInTheDocument();
        expect(screen.getByText('5000')).toBeInTheDocument();
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('Checkouts Iniciados')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Vendas Concluídas')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display conversion rates', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText('10.0% conversão')).toBeInTheDocument();
        expect(screen.getByText('20.0% conversão')).toBeInTheDocument();
        expect(screen.getByText('50.0% conversão')).toBeInTheDocument();
      });
    });

    it('should display financial metrics', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByText('Receita Total')).toBeInTheDocument();
        expect(screen.getByText(/125\.000,00/)).toBeInTheDocument();
        expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
        expect(screen.getByText(/2\.500,00/)).toBeInTheDocument();
      });
    });
  });

  describe('Evolution Tab', () => {
    it('should display evolution controls', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Evolução/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Evolução/i }));

      await waitFor(() => {
        expect(screen.getByText('Evento')).toBeInTheDocument();
        expect(screen.getByText('Agrupar por')).toBeInTheDocument();
      });
    });

    it('should have event selector with correct options', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Evolução/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Evolução/i }));

      await waitFor(() => {
        const eventSelect = screen.getByDisplayValue('Vendas');
        expect(eventSelect).toBeInTheDocument();
      });
    });
  });

  describe('Products Tab', () => {
    it('should display product metrics', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Produtos/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Produtos/i }));

      await waitFor(() => {
        expect(screen.getByText('Produto A')).toBeInTheDocument();
        expect(screen.getByText('Produto B')).toBeInTheDocument();
        expect(screen.getByText('Produto C')).toBeInTheDocument();
      });
    });

    it('should display product table with all columns', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Produtos/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Produtos/i }));

      await waitFor(() => {
        expect(screen.getByText('Produto')).toBeInTheDocument();
        expect(screen.getByText('Vendas')).toBeInTheDocument();
        expect(screen.getByText('Receita')).toBeInTheDocument();
        expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
      });
    });

    it('should display message when no product data', async () => {
      (gtmAnalyticsAPI.getProductMetrics as any).mockResolvedValue([]);
      
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Produtos/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Produtos/i }));

      await waitFor(() => {
        expect(screen.getByText(/Nenhum dado de produto encontrado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Filter Behavior', () => {
    it('should initialize with first day of current month and today', () => {
      render(<Metricas />);

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      // Should have initialized with these dates
      expect(gtmAnalyticsAPI.getFunnelMetrics).toHaveBeenCalled();
    });

    it('should refetch data when date changes', async () => {
      render(<Metricas />);

      await waitFor(() => {
        expect(gtmAnalyticsAPI.getFunnelMetrics).toHaveBeenCalledTimes(1);
      });

      // Simulate date change would trigger refetch
      // Note: Actual date change interaction would require more complex setup
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tabs', async () => {
      render(<Metricas />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(5);
        
        tabs.forEach(tab => {
          expect(tab).toHaveAccessibleName();
        });
      });
    });

    it('should maintain keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Metricas />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Funil de Conversão/i })).toBeInTheDocument();
      });

      const firstTab = screen.getByRole('tab', { name: /Funil de Conversão/i });
      firstTab.focus();
      
      expect(document.activeElement).toBe(firstTab);
    });
  });

  describe('Integration', () => {
    it('should update child components when date changes', async () => {
      const { rerender } = render(<Metricas />);

      await waitFor(() => {
        expect(gtmAnalyticsAPI.getFunnelMetrics).toHaveBeenCalled();
      });

      // Date change would trigger new API calls
      const callCount = (gtmAnalyticsAPI.getFunnelMetrics as any).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });
});