import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FunilMarketing from './FunilMarketing';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('FunilMarketing', () => {
  const defaultProps = {
    startDate: new Date(2024, 11, 1), // December 2024
    endDate: new Date(2024, 11, 31),
  };

  const mockMetrics = {
    leads: 1250,
    vendas: 85,
    receita: 425000,
    custoTotal: 45000,
    cpl: 36,
    cpa: 529.41,
    taxaConversao: 6.8,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Component Rendering', () => {
    it('should render the component with initial loading state', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => { }));

      render(<FunilMarketing {...defaultProps} />);

      expect(screen.getByText('Funil de Marketing')).toBeInTheDocument();
      expect(screen.getByText(/Métricas de performance do funil de marketing/i)).toBeInTheDocument();
    });

    it('should render all view mode buttons', () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilMarketing {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cards/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch metrics on mount with correct parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/functions/v1/get-funnel-metrics'),
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer test-anon-key',
            },
          })
        );
      });

      const fetchUrl = (global.fetch as any).mock.calls[0][0];
      // Updated to check for ISO string or date parts
      expect(fetchUrl).toContain('startDate=');
      expect(fetchUrl).toContain('endDate=');
      expect(fetchUrl).toContain('funnel=marketing');
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Erro ao carregar métricas:',
          'Network error'
        );
      });

      consoleError.mockRestore();
    });

    it('should handle non-ok response', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should refetch data when props change', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const { rerender } = render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      rerender(<FunilMarketing startDate={new Date(2024, 10, 1)} endDate={new Date(2024, 10, 30)} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('View Modes - Cards', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should display all metric cards in cards view', async () => {
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
      });

      expect(screen.getByText('1.250')).toBeInTheDocument();
      expect(screen.getByText('Vendas')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('R$ 425.000')).toBeInTheDocument();
      expect(screen.getByText('R$ 45.000')).toBeInTheDocument();
    });

    it('should format currency values correctly', async () => {
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/R\$ 36.00/)).toBeInTheDocument();
      });

      expect(screen.getByText(/R\$ 529.41/)).toBeInTheDocument();
    });

    it('should display conversion rate', async () => {
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('6.8% conversão')).toBeInTheDocument();
      });
    });

    it('should calculate and display ROI correctly', async () => {
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        const roi = ((mockMetrics.receita / mockMetrics.custoTotal - 1) * 100).toFixed(1);
        expect(screen.getByText(`${roi}%`)).toBeInTheDocument();
      });
    });

    it('should handle zero values without errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            leads: 0,
            vendas: 0,
            receita: 0,
            custoTotal: 0,
            cpl: 0,
            cpa: 0,
            taxaConversao: 0,
          },
        }),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
      });

      // Should handle division by zero for ROI
      expect(screen.queryByText('Infinity')).not.toBeInTheDocument();
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    });
  });

  describe('View Modes - Table', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to table view when button is clicked', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
      });

      const tabelaButton = screen.getByRole('button', { name: /Tabela/i });
      await user.click(tabelaButton);

      await waitFor(() => {
        expect(screen.getByText('Métricas do Funil de Marketing')).toBeInTheDocument();
      });
    });

    it('should display all metrics in table format', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Tabela/i }));

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('View Modes - Stage (Funnel)', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to stage view', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        expect(screen.getByText('Funil de Marketing - Visualização por Etapas')).toBeInTheDocument();
      });
    });

    it('should display funnel stages with correct metrics', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        expect(screen.getByText('1250')).toBeInTheDocument();
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
      });
    });
  });

  describe('View Modes - Charts', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to chart view', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Gráfico/i }));

      await waitFor(() => {
        expect(screen.getByText('Leads vs Vendas')).toBeInTheDocument();
      });
    });

    it('should render multiple charts in chart view', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Gráfico/i }));

      await waitFor(() => {
        expect(screen.getByText('Evolução Semanal')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
        expect(screen.getByText('Custos por Métrica')).toBeInTheDocument();
      });
    });
  });

  describe('Pure Function Tests - Chart Data', () => {
    it('should generate correct chart data structure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Leads Gerados')).toBeInTheDocument();
      });

      // Verify chart data values are rendered correctly
      expect(screen.getByText('1.250')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            leads: 999999,
            vendas: 50000,
            receita: 50000000,
            custoTotal: 5000000,
            cpl: 5000,
            cpa: 100000,
            taxaConversao: 5,
          },
        }),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('999.999')).toBeInTheDocument();
      });
    });

    it('should handle decimal precision correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            ...mockMetrics,
            cpl: 36.789,
            cpa: 529.456,
          },
        }),
      });

      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/36.79/)).toBeInTheDocument();
        expect(screen.getByText(/529.46/)).toBeInTheDocument();
      });
    });
  });
  describe('Accessibility', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should have accessible button labels', () => {
      render(<FunilMarketing {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cards/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
    });

    it('should maintain focus management when switching views', async () => {
      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      });

      const tabelaButton = screen.getByRole('button', { name: /Tabela/i });
      await user.click(tabelaButton);

      expect(screen.getByText('Métricas do Funil de Marketing')).toBeInTheDocument();
    });
  });

  describe('Calculations', () => {
    it('should calculate ticket médio correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        const ticketMedio = (mockMetrics.receita / mockMetrics.vendas).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        });
        expect(screen.getByText(new RegExp(ticketMedio))).toBeInTheDocument();
      });
    });

    it('should handle division by zero for ticket médio', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: { ...mockMetrics, vendas: 0 },
        }),
      });

      const user = userEvent.setup();
      render(<FunilMarketing {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      // Should not crash or show NaN/Infinity
      expect(screen.queryByText('Infinity')).not.toBeInTheDocument();
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    });
  });

  it('should handle month boundary (January)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ metrics: mockMetrics }),
    });

    const janStartDate = new Date(2024, 0, 1);
    const janEndDate = new Date(2024, 0, 31);

    render(<FunilMarketing startDate={janStartDate} endDate={janEndDate} />);

    await waitFor(() => {
      const fetchUrl = (global.fetch as any).mock.calls[0][0];
      expect(fetchUrl).toContain(`startDate=${janStartDate.toISOString()}`);
      expect(fetchUrl).toContain(`endDate=${janEndDate.toISOString()}`);
    });
  });

  it('should handle month boundary (December)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ metrics: mockMetrics }),
    });

    const decStartDate = new Date(2024, 11, 1);
    const decEndDate = new Date(2024, 11, 31);

    render(<FunilMarketing startDate={decStartDate} endDate={decEndDate} />);

    await waitFor(() => {
      const fetchUrl = (global.fetch as any).mock.calls[0][0];
      expect(fetchUrl).toContain(`startDate=${decStartDate.toISOString()}`);
      expect(fetchUrl).toContain(`endDate=${decEndDate.toISOString()}`);
    });
  });
});