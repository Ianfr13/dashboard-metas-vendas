/**
 * Cloudflare Worker para SPA routing
 * Redireciona todas as rotas não encontradas para index.html
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Tentar buscar o asset
      let response = await env.ASSETS.fetch(request);
      
      // Se não encontrou (404) e não é um arquivo estático, retornar index.html
      if (response.status === 404) {
        const pathname = url.pathname;
        
        // Se não tem extensão de arquivo, é uma rota do SPA
        if (!pathname.includes('.') || pathname === '/') {
          const indexRequest = new Request(new URL('/index.html', url.origin), request);
          response = await env.ASSETS.fetch(indexRequest);
        }
      }
      
      return response;
    } catch (error) {
      return new Response(`Worker Error: ${error.message}`, { status: 500 });
    }
  },
};
