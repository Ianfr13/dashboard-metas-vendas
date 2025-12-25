/**
 * Cloudflare Worker para SPA routing
 * Serve arquivos estáticos e faz fallback para index.html
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Se não tem extensão de arquivo, é uma rota do SPA
    // Redirecionar para index.html
    if (!pathname.includes('.') && pathname !== '/') {
      url.pathname = '/index.html';
      return fetch(new URL(url), request);
    }
    
    // Caso contrário, servir o arquivo normalmente
    return fetch(request);
  },
};
