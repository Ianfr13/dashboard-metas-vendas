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
