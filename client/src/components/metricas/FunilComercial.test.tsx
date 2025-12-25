import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FunilComercial from './FunilComercial';

// Mock recharts
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

describe('FunilComercial', () => {
  const defaultProps = {
    selectedMonth: 12,
    selectedYear: 2024,
  };

  const mockMetrics = {
    agendamentos: 200,
    contatos: 170,
    vendas: 51,
    receita: 255000,
    taxaConversao: 30,
    taxaAgendamento: 85,
    noShow: 30,
    taxaPresenca: 85,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));
      
      render(<FunilComercial {...defaultProps} />);
      
      expect(screen.getByText('Funil Comercial')).toBeInTheDocument();
      expect(screen.getByText(/Métricas de performance do funil comercial/i)).toBeInTheDocument();
    });

    it('should render all view mode buttons', () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilComercial {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Cards/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch metrics with correct URL parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilComercial {...defaultProps} />);

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
      expect(fetchUrl).toContain('month=12');
      expect(fetchUrl).toContain('year=2024');
      expect(fetchUrl).toContain('funnel=comercial');
    });

    it('should handle failed API calls gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Erro ao carregar métricas:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle non-200 responses', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should refetch when selectedMonth changes', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const { rerender } = render(<FunilComercial {...defaultProps} />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

      rerender(<FunilComercial selectedMonth={11} selectedYear={2024} />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    });

    it('should refetch when selectedYear changes', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const { rerender } = render(<FunilComercial {...defaultProps} />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

      rerender(<FunilComercial selectedMonth={12} selectedYear={2023} />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    });
  });

  describe('Cards View', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should display all metric cards', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Agendamentos')).toBeInTheDocument();
      });

      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('Contatos Realizados')).toBeInTheDocument();
      expect(screen.getByText('170')).toBeInTheDocument();
      expect(screen.getByText('Vendas')).toBeInTheDocument();
      expect(screen.getByText('51')).toBeInTheDocument();
    });

    it('should display taxa de presença with contatos', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('85% taxa de presença')).toBeInTheDocument();
      });
    });

    it('should display taxa de conversão with vendas', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('30% conversão')).toBeInTheDocument();
      });
    });

    it('should format receita correctly', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/255\.000/)).toBeInTheDocument();
      });
    });

    it('should display no-show percentage', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        const noShowPercentage = ((mockMetrics.noShow / mockMetrics.agendamentos) * 100).toFixed(1);
        expect(screen.getByText(`${noShowPercentage}% dos agendamentos`)).toBeInTheDocument();
      });
    });

    it('should handle zero agendamentos without division errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: { ...mockMetrics, agendamentos: 0 },
        }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Agendamentos')).toBeInTheDocument();
      });

      expect(screen.queryByText('Infinity')).not.toBeInTheDocument();
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    });

    it('should display all rate cards', async () => {
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Taxa de Agendamento')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Presença')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
      });
    });
  });

  describe('Table View', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to table view', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Tabela/i }));

      await waitFor(() => {
        expect(screen.getByText('Métricas do Funil Comercial')).toBeInTheDocument();
      });
    });

    it('should display table with all metrics', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

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

  describe('Stage View', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to stage view', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        expect(screen.getByText('Funil Comercial - Visualização por Etapas')).toBeInTheDocument();
      });
    });

    it('should display funnel stages', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        expect(screen.getAllByText('200').length).toBeGreaterThan(0);
        expect(screen.getAllByText('170').length).toBeGreaterThan(0);
        expect(screen.getAllByText('51').length).toBeGreaterThan(0);
      });
    });

    it('should display performance and perdas cards', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      await waitFor(() => {
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.getByText('Perdas')).toBeInTheDocument();
      });
    });
  });

  describe('Chart View', () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });
    });

    it('should switch to chart view', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Gráfico/i }));

      await waitFor(() => {
        expect(screen.getByText('Funil Completo')).toBeInTheDocument();
      });
    });

    it('should display multiple charts', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Gráfico/i }));

      await waitFor(() => {
        expect(screen.getByText('Taxas de Performance')).toBeInTheDocument();
        expect(screen.getByText('Evolução Semanal')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Presença vs No-Show')).toBeInTheDocument();
      });
    });
  });

  describe('Calculations', () => {
    it('should calculate no-show percentage correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        const expected = ((mockMetrics.noShow / mockMetrics.agendamentos) * 100).toFixed(1);
        expect(screen.getByText(`${expected}% dos agendamentos`)).toBeInTheDocument();
      });
    });

    it('should calculate ticket médio correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

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

    it('should handle zero vendas for ticket médio calculation', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: { ...mockMetrics, vendas: 0 },
        }),
      });

      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stage/i }));

      // Should not crash or display error values
      expect(screen.queryByText('Infinity')).not.toBeInTheDocument();
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all zero metrics', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            agendamentos: 0,
            contatos: 0,
            vendas: 0,
            receita: 0,
            taxaConversao: 0,
            taxaAgendamento: 0,
            noShow: 0,
            taxaPresenca: 0,
          },
        }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Agendamentos')).toBeInTheDocument();
      });

      // Should display zeros without errors
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('should handle very large numbers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            agendamentos: 999999,
            contatos: 850000,
            vendas: 425000,
            receita: 2125000000,
            taxaConversao: 42.5,
            taxaAgendamento: 85,
            noShow: 149999,
            taxaPresenca: 85,
          },
        }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('999999')).toBeInTheDocument();
      });
    });

    it('should handle decimal rates correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          metrics: {
            ...mockMetrics,
            taxaConversao: 30.567,
            taxaPresenca: 85.234,
          },
        }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('30.567%')).toBeInTheDocument();
        expect(screen.getByText('85.234%')).toBeInTheDocument();
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

    it('should have accessible navigation buttons', () => {
      render(<FunilComercial {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should update button states when clicked', async () => {
      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
      });

      const tabelaButton = screen.getByRole('button', { name: /Tabela/i });
      await user.click(tabelaButton);

      expect(tabelaButton).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Chart Data Generation', () => {
    it('should generate correct chartData structure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Agendamentos')).toBeInTheDocument();
      });

      // Verify the data is rendered correctly
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('170')).toBeInTheDocument();
      expect(screen.getByText('51')).toBeInTheDocument();
    });

    it('should generate evolution data for charts', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: mockMetrics }),
      });

      const user = userEvent.setup();
      render(<FunilComercial {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Gráfico/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Gráfico/i }));

      await waitFor(() => {
        expect(screen.getByText('Evolução Semanal')).toBeInTheDocument();
      });
    });
  });
});