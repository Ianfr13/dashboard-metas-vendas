/**
 * A/B Redirect Worker
 * 
 * Ultra-fast edge redirector for A/B testing.
 * - Uses KV cache for instant lookups
 * - Preserves all UTM parameters
 * - 302 redirect (invisible to trackers)
 * - Async visit counting (doesn't block redirect)
 */

/// <reference types="@cloudflare/workers-types" />

export interface Env {
    AB_CACHE: KVNamespace;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ABTestVariant {
    id: number;
    name: string;
    url: string;
    weight: number;
}

interface ABTest {
    id: number;
    name: string;
    slug: string;
    status: string;
    variants: ABTestVariant[];
}

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

/**
 * Select a variant based on weights using weighted random selection
 */
function selectVariant(variants: ABTestVariant[]): ABTestVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) {
        // If all weights are 0, select randomly
        return variants[Math.floor(Math.random() * variants.length)];
    }

    let random = Math.random() * totalWeight;

    for (const variant of variants) {
        random -= variant.weight;
        if (random <= 0) {
            return variant;
        }
    }

    // Fallback to last variant
    return variants[variants.length - 1];
}

/**
 * Append UTM parameters from original URL to destination URL
 */
function appendUtmParams(destinationUrl: string, originalUrl: URL): string {
    const destUrl = new URL(destinationUrl);

    // List of parameters to preserve
    const paramsToPreserve = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'ttclid', 'li_fat_id', // Ad platform click IDs
        'ref', 'source', 'campaign' // Common custom params
    ];

    // Copy all params from original URL
    for (const [key, value] of originalUrl.searchParams) {
        // Skip the 'test' param if present (legacy)
        if (key === 'test') continue;

        // Preserve important params, don't overwrite if already in destination
        if (!destUrl.searchParams.has(key)) {
            destUrl.searchParams.set(key, value);
        }
    }

    return destUrl.toString();
}

/**
 * Fetch test config from Supabase
 */
async function fetchTestFromSupabase(slug: string, env: Env): Promise<ABTest | null> {
    try {
        // Fetch test
        const testResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/ab_tests?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=id,name,slug,status`,
            {
                headers: {
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                }
            }
        );

        if (!testResponse.ok) {
            console.error('[ab-redirect] Failed to fetch test:', await testResponse.text());
            return null;
        }

        const tests = await testResponse.json() as ABTest[];
        if (tests.length === 0) {
            return null;
        }

        const test = tests[0];

        // Fetch variants
        const variantsResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/ab_test_variants?test_id=eq.${test.id}&select=id,name,url,weight`,
            {
                headers: {
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                }
            }
        );

        if (!variantsResponse.ok) {
            console.error('[ab-redirect] Failed to fetch variants:', await variantsResponse.text());
            return null;
        }

        const variants = await variantsResponse.json() as ABTestVariant[];

        return {
            ...test,
            variants
        };
    } catch (error) {
        console.error('[ab-redirect] Error fetching from Supabase:', error);
        return null;
    }
}

/**
 * Increment visit count for a variant (async, doesn't block)
 */
async function incrementVisitCount(variantId: number, env: Env): Promise<void> {
    try {
        await fetch(
            `${env.SUPABASE_URL}/rest/v1/rpc/increment_ab_variant_visits`,
            {
                method: 'POST',
                headers: {
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variant_id: variantId })
            }
        );
    } catch (error) {
        console.error('[ab-redirect] Error incrementing visits:', error);
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // CORS Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // Or 'https://dashboard.douravita.com.br' for strictness
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS Preflight (OPTIONS)
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        // Helper to add CORS to any response
        const cors = (res: Response) => {
            const newHeaders = new Headers(res.headers);
            Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
            return new Response(res.body, {
                status: res.status,
                statusText: res.statusText,
                headers: newHeaders
            });
        };

        // Rota de Admin para limpar cache (Purge)
        // Ex: POST /admin/purge?slug=xxx
        // Header: Authorization: Bearer <jwt>
        if (url.pathname === '/admin/purge' && request.method === 'POST') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return cors(new Response('Missing Authorization header', { status: 401 }));
            }

            // Validar Token no Supabase
            const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'Authorization': authHeader,
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY
                }
            });

            if (!userResponse.ok) {
                return cors(new Response('Unauthorized', { status: 401 }));
            }

            const slugToPurge = url.searchParams.get('slug');
            if (slugToPurge) {
                const cacheKey = `ab:${slugToPurge}`;
                const pageKey = `page:${slugToPurge}`;
                await env.AB_CACHE.delete(cacheKey);
                await env.AB_CACHE.delete(pageKey);
                return cors(new Response(`Cache purged for ${slugToPurge}`, { status: 200 }));
            }
            return cors(new Response('Missing slug param', { status: 400 }));
        }

        // Rota de Admin para Publicar Página (CMS)
        // POST /admin/pages
        // Body: { slug: "...", html: "..." }
        if (url.pathname === '/admin/pages' && request.method === 'POST') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) return cors(new Response('Missing Authorization header', { status: 401 }));

            const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'Authorization': authHeader,
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY
                }
            });

            if (!userResponse.ok) return cors(new Response('Unauthorized', { status: 401 }));

            try {
                const body = await request.json() as { slug: string, html: string };
                if (!body.slug || !body.html) return cors(new Response('Missing slug or html', { status: 400 }));

                await env.AB_CACHE.put(`page:${body.slug}`, body.html);
                return cors(new Response('Page published', { status: 200 }));
            } catch (e) {
                return cors(new Response('Invalid JSON', { status: 400 }));
            }
        }

        // Extract slug from path (e.g., /x7k9m2p1 -> x7k9m2p1)
        const slug = url.pathname.slice(1).split('/')[0];

        if (!slug || slug === '' || slug === 'favicon.ico') {
            return new Response('Not Found', { status: 404 });
        }

        // 1. TENTATIVA: PÁGINA ESTÁTICA (CMS)
        // Verifica se é uma página publicada pelo painel
        const pageHtml = await env.AB_CACHE.get(`page:${slug}`);
        if (pageHtml) {
            // AUTOMATIC FIX: Inject CSS to ensure .esconder works with Tailwind
            // Use specific selector (body .esconder) to beat Tailwind (.grid) without !important
            // This allows JS to override it with inline styles later
            const fixedHtml = pageHtml.replace(
                '</head>',
                '<style>body .esconder { display: none; }</style></head>'
            );

            return new Response(fixedHtml, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // 2. TENTATIVA: TESTE A/B
        // Try to get from cache first
        const cacheKey = `ab:${slug}`;
        let test: ABTest | null = null;

        // SWR: Get cached data (including metadata)
        const cachedResult = await env.AB_CACHE.get<{ data: ABTest, written_at: number }>(cacheKey, 'json');

        const now = Date.now();
        const shouldRevalidate = !cachedResult || (now - cachedResult.written_at > CACHE_TTL * 1000);

        if (cachedResult) {
            test = cachedResult.data;
        }

        // Logic to fetch from Supabase and update cache
        const revalidate = async () => {
            const fetchedTest = await fetchTestFromSupabase(slug, env);
            if (fetchedTest) {
                await env.AB_CACHE.put(cacheKey, JSON.stringify({
                    data: fetchedTest,
                    written_at: Date.now()
                })); // No TTL: let it be persistent, we manage freshness manually
            }
            return fetchedTest;
        };

        if (!test) {
            // Cache Miss: Must block and wait for fetch
            test = await revalidate();
        } else if (shouldRevalidate) {
            // SWR: We have stale data, serve it NOW, update in background
            ctx.waitUntil(revalidate());
        }

        // Test not found or inactive
        if (!test) {
            return new Response('Test not found', { status: 404 });
        }

        // No variants configured
        if (!test.variants || test.variants.length === 0) {
            return new Response('No variants configured', { status: 500 });
        }

        // Select variant based on weights
        const selectedVariant = selectVariant(test.variants);

        // Build destination URL with preserved UTM params
        const destinationUrl = appendUtmParams(selectedVariant.url, url);

        // Increment visit count asynchronously (don't block redirect)
        ctx.waitUntil(incrementVisitCount(selectedVariant.id, env));

        // Return 302 redirect (instant, invisible to trackers)
        return Response.redirect(destinationUrl, 302);
    }
};
