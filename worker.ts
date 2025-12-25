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
    
    // Lista de extensões de arquivos estáticos
    const staticExtensions = [
      '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
      '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', 
      '.xml', '.txt', '.webp', '.avif', '.map'
    ];
    
    const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext));
    
    try {
      // Tentar buscar o arquivo primeiro
      const response = await env.ASSETS.fetch(request);
      
      // Se for arquivo estático e encontrou, retornar
      if (isStaticFile && response.status === 200) {
        return response;
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
      return new Response(`Internal Server Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};
