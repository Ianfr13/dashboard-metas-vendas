/**
 * Cloudflare Worker para SPA routing
 * Serve arquivos estáticos e faz fallback para index.html
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Lista de extensões de arquivos estáticos
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.txt'];
    
    // Verificar se é um arquivo estático
    const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext));
    
    // Se não é arquivo estático, servir index.html para SPA routing
    if (!isStaticFile && pathname !== '/' && pathname !== '/index.html') {
      // Buscar index.html dos assets
      const indexUrl = new URL('/index.html', url.origin);
      const indexRequest = new Request(indexUrl, {
        method: request.method,
        headers: request.headers,
      });
      
      return env.ASSETS.fetch(indexRequest);
    }
    
    // Servir o arquivo normalmente
    return env.ASSETS.fetch(request);
  },
};
