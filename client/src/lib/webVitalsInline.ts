// Web Vitals Monitoring Inline
// Coleta métricas de performance e envia para /api/analytics

// Função para enviar métricas
function sendMetric(name: string, value: number, rating: string) {
    const body = JSON.stringify({
        name,
        value,
        rating,
        timestamp: new Date().toISOString(),
        url: window.location.href
    });

    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', body);
    } else {
        fetch('/api/analytics', {
            method: 'POST',
            body,
            keepalive: true,
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
            // Ignorar erros silenciosamente
        });
    }
}

// Função para calcular rating
function getRating(name: string, value: number): string {
    const thresholds: Record<string, [number, number]> = {
        'LCP': [2500, 4000],
        'FID': [100, 300],
        'CLS': [0.1, 0.25],
        'FCP': [1800, 3000],
        'TTFB': [800, 1800]
    };

    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
}

// Largest Contentful Paint (LCP)
if ('PerformanceObserver' in window) {
    try {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            const value = lastEntry.renderTime || lastEntry.loadTime;
            sendMetric('LCP', value, getRating('LCP', value));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                const value = entry.processingStart - entry.startTime;
                sendMetric('FID', value, getRating('FID', value));
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Enviar CLS ao sair da página
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                sendMetric('CLS', clsValue, getRating('CLS', clsValue));
            }
        });

        console.log('[Performance] Web Vitals monitoring ativo (inline)');
    } catch (e) {
        console.warn('[Performance] Erro ao inicializar Web Vitals:', e);
    }
}

// First Contentful Paint (FCP) e TTFB via Navigation Timing
window.addEventListener('load', () => {
    setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as any;
        if (perfData) {
            // TTFB
            const ttfb = perfData.responseStart - perfData.requestStart;
            sendMetric('TTFB', ttfb, getRating('TTFB', ttfb));

            // FCP
            const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as any;
            if (fcpEntry) {
                sendMetric('FCP', fcpEntry.startTime, getRating('FCP', fcpEntry.startTime));
            }
        }
    }, 0);
});
