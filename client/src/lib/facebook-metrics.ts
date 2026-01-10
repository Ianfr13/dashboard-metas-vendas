// Facebook Ads Metric Configuration
export interface MetricConfig {
    key: string;
    label: string;
    format: 'currency' | 'number' | 'percent' | 'decimal';
    group: 'basic' | 'conversions' | 'value' | 'video';
}

export const FACEBOOK_METRICS: MetricConfig[] = [
    // Basic Metrics
    { key: 'spend', label: 'Gasto', format: 'currency', group: 'basic' },
    { key: 'impressions', label: 'Impressões', format: 'number', group: 'basic' },
    { key: 'reach', label: 'Alcance', format: 'number', group: 'basic' },
    { key: 'frequency', label: 'Frequência', format: 'decimal', group: 'basic' },
    { key: 'clicks', label: 'Cliques', format: 'number', group: 'basic' },
    { key: 'uniqueClicks', label: 'Cliques Únicos', format: 'number', group: 'basic' },
    { key: 'ctr', label: 'CTR', format: 'percent', group: 'basic' },
    { key: 'uniqueCtr', label: 'CTR Único', format: 'percent', group: 'basic' },
    { key: 'cpc', label: 'CPC', format: 'currency', group: 'basic' },
    { key: 'cpm', label: 'CPM', format: 'currency', group: 'basic' },
    { key: 'cpp', label: 'CPP', format: 'currency', group: 'basic' },
    { key: 'dailyBudget', label: 'Orçamento Diário', format: 'currency', group: 'basic' },

    // Conversion Metrics
    { key: 'leads', label: 'Leads', format: 'number', group: 'conversions' },
    { key: 'purchases', label: 'Compras', format: 'number', group: 'conversions' },
    { key: 'addToCart', label: 'Add to Cart', format: 'number', group: 'conversions' },
    { key: 'initiateCheckout', label: 'Iniciar Checkout', format: 'number', group: 'conversions' },
    { key: 'landingPageViews', label: 'Visualiz. Página', format: 'number', group: 'conversions' },
    { key: 'linkClicks', label: 'Cliques em Link', format: 'number', group: 'conversions' },

    // Value Metrics
    { key: 'purchaseValue', label: 'Valor Compras', format: 'currency', group: 'value' },
    { key: 'leadValue', label: 'Valor Leads', format: 'currency', group: 'value' },
    { key: 'costPerLead', label: 'Custo/Lead', format: 'currency', group: 'value' },
    { key: 'costPerPurchase', label: 'Custo/Compra', format: 'currency', group: 'value' },
    { key: 'roas', label: 'ROAS', format: 'decimal', group: 'value' },

    // Video Metrics
    { key: 'videoViews', label: 'Visualiz. Vídeo', format: 'number', group: 'video' },
    { key: 'videoP25Watched', label: '25% Vídeo', format: 'number', group: 'video' },
    { key: 'videoP50Watched', label: '50% Vídeo', format: 'number', group: 'video' },
    { key: 'videoP75Watched', label: '75% Vídeo', format: 'number', group: 'video' },
    { key: 'videoP100Watched', label: '100% Vídeo', format: 'number', group: 'video' },
];

export const DEFAULT_METRICS = ['spend', 'impressions', 'clicks', 'ctr', 'leads', 'purchases', 'roas'];

export const METRIC_GROUPS = {
    basic: 'Métricas Básicas',
    conversions: 'Conversões',
    value: 'Valores e ROI',
    video: 'Métricas de Vídeo',
    calculated: 'Métricas Calculadas',
};

export function formatMetricValue(value: number | null | undefined, format: MetricConfig['format']): string {
    const safeValue = value || 0;

    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeValue);
        case 'number':
            return new Intl.NumberFormat('pt-BR').format(Math.round(safeValue));
        case 'percent':
            return `${safeValue.toFixed(2)}%`;
        case 'decimal':
            return safeValue.toFixed(2);
        default:
            return String(safeValue);
    }
}

// ============================================
// CALCULATED METRICS (Frontend-only)
// ============================================

export interface CalculatedMetric {
    key: string;
    label: string;
    formula: string; // e.g., "spend / purchases" or "(clicks / impressions) * 100"
    format: 'currency' | 'number' | 'percent' | 'decimal';
    group: 'calculated';
}

// Built-in calculated metrics - can be extended by user later
export const CALCULATED_METRICS: CalculatedMetric[] = [
    { key: 'costPerResult', label: 'Custo/Resultado', formula: 'spend / (leads + purchases)', format: 'currency', group: 'calculated' },
    { key: 'conversionRate', label: 'Taxa Conversão', formula: '(purchases / clicks) * 100', format: 'percent', group: 'calculated' },
    { key: 'cartToCheckoutRate', label: 'Carrinho→Checkout', formula: '(initiateCheckout / addToCart) * 100', format: 'percent', group: 'calculated' },
    { key: 'checkoutToPurchaseRate', label: 'Checkout→Compra', formula: '(purchases / initiateCheckout) * 100', format: 'percent', group: 'calculated' },
    { key: 'avgOrderValue', label: 'Ticket Médio', formula: 'purchaseValue / purchases', format: 'currency', group: 'calculated' },
    { key: 'leadToSaleRate', label: 'Lead→Venda', formula: '(purchases / leads) * 100', format: 'percent', group: 'calculated' },
];

/**
 * Safely evaluate a formula string using cached metric data
 * @param formula - Formula string like "spend / purchases" 
 * @param data - Object with metric values, e.g., { spend: 100, purchases: 5 }
 * @returns Calculated value or 0 if error/division by zero
 */
export function evaluateFormula(formula: string, data: Record<string, number>): number {
    try {
        // Replace metric keys with their values
        let expression = formula;

        // Sort keys by length (longest first) to avoid partial replacements
        const sortedKeys = Object.keys(data).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
            const value = data[key] || 0;
            expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        }

        // Check for division by zero scenarios (replace /0 patterns)
        if (/\/\s*0(?![.\d])/.test(expression) || /\/\s*\(0\)/.test(expression)) {
            return 0;
        }

        // Safe evaluation using Function constructor (no eval)
        const result = Function(`"use strict"; return (${expression})`)();

        // Handle NaN, Infinity
        if (!isFinite(result) || isNaN(result)) {
            return 0;
        }

        return result;
    } catch {
        return 0;
    }
}

// All metrics combined for selectors
export const ALL_METRICS = [
    ...FACEBOOK_METRICS,
    ...CALCULATED_METRICS.map(m => ({ ...m, group: 'calculated' as const }))
];

