/**
 * Cloudflare Worker para SPA routing
 * Serve arquivos estáticos e faz fallback para index.html
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Validar se ASSETS está disponível
    if (!env.ASSETS) {
      console.error('ASSETS binding not configured');
      return new Response('Assets binding not configured', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Analytics Endpoint para Web Vitals
    if (pathname === '/api/analytics' && request.method === 'POST') {
      try {
        const metrics = await request.json();

        // Log para Cloudflare Analytics
        console.log('[Web Vitals]', {
          metric: metrics.name,
          value: metrics.value,
          rating: metrics.rating,
          timestamp: metrics.timestamp || new Date().toISOString()
        });

        return new Response('OK', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response('Error', { status: 500 });
      }
    }

    // Lista de extensões de arquivos estáticos
    const staticExtensions = [
      '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
      '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json',
      '.xml', '.txt', '.webp', '.avif', '.map'
    ];

    /**
     * Determina os headers de cache apropriados baseado no tipo de arquivo
     * Assets com hash no nome recebem cache imutável de 1 ano
     */
    const getCacheHeaders = (pathname: string): Record<string, string> => {
      const ext = pathname.split('.').pop()?.toLowerCase();

      const headers: Record<string, string> = {};

      // Assets imutáveis (com hash no nome do arquivo)
      // Ex: main.a1b2c3d4.js, styles.x7y8z9.css
      if (pathname.includes('.') && /\.[a-f0-9]{8,}\./i.test(pathname)) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      // JavaScript e CSS (assumindo que Vite gera com hash)
      else if (ext === 'js' || ext === 'css') {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      // Imagens e fonts (1 ano, imutável)
      else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'woff', 'woff2', 'ttf', 'eot'].includes(ext || '')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      // Source maps (1 ano)
      else if (ext === 'map') {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      // JSON, XML, TXT (1 hora com revalidação)
      else if (['json', 'xml', 'txt'].includes(ext || '')) {
        headers['Cache-Control'] = 'public, max-age=3600, must-revalidate';
      }
      // HTML (sem cache, sempre revalidar)
      else if (ext === 'html' || !ext) {
        headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
      }

      return headers;
    };

    const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext));

    try {
      // Tentar buscar o arquivo primeiro
      const response = await env.ASSETS.fetch(request);

      // Se for arquivo estático e encontrou, retornar com cache headers
      if (isStaticFile && response.status === 200) {
        const cacheHeaders = getCacheHeaders(pathname);
        const newHeaders = new Headers(response.headers);

        // Aplicar headers de cache
        Object.entries(cacheHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      // Se não é arquivo estático ou não encontrou (404), servir index.html
      if (!isStaticFile || response.status === 404) {
        const indexUrl = new URL('/index.html', url.origin);
        const indexRequest = new Request(indexUrl, {
          method: 'GET',
          headers: request.headers,
        });

        const indexResponse = await env.ASSETS.fetch(indexRequest);

        // Garantir que retornamos HTML mesmo se index.html não for encontrado
        if (indexResponse.status === 404) {
          return new Response('Index.html not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        return indexResponse;
      }

      return response;

    } catch (error) {
      console.error('Worker error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Internal Server Error: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};
