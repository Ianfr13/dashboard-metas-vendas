/**
 * Cloudflare Worker para SPA routing
 * Redireciona todas as rotas não encontradas para index.html
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Tentar buscar o asset
    const response = await env.ASSETS.fetch(request);
    
    // Se não encontrou (404) e não é um arquivo estático, retornar index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      // Criar nova request para index.html
      const indexUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }
    
    return response;
  },
};
