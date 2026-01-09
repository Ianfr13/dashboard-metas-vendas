
export interface UrlParams {
    baseUrl: string;
    fid?: string; // Funnel ID
    fver?: string; // Funnel Version
    pver?: string; // Page Version
    oid?: string; // Offer ID
    fstg?: string; // Funnel Stage (New)
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

export function generateTrackingUrl(params: UrlParams): string {
    let { baseUrl } = params;
    if (!baseUrl) return '';

    // Clean baseUrl of trailing slash locally for logic, but be careful with query params
    // Use URL object to robustly handle existing query params
    let urlObj: URL;
    try {
        // If baseUrl doesn't have protocol, add https:// temporarily
        const hasProtocol = baseUrl.match(/^https?:\/\//);
        urlObj = new URL(hasProtocol ? baseUrl : `https://${baseUrl}`);
    } catch (e) {
        // Fallback for invalid URLs - though we expect valid input
        return baseUrl;
    }

    // Helper to append path segment correctly
    const appendPath = (key: string, value?: string) => {
        if (value && value.trim() !== '') {
            // Ensure no double slashes
            if (!urlObj.pathname.endsWith('/')) {
                urlObj.pathname += '/';
            }
            urlObj.pathname += `${key}=${value.trim()}`;
        }
    };

    appendPath('fid', params.fid);
    appendPath('fver', params.fver);
    appendPath('pver', params.pver);
    appendPath('oid', params.oid);
    appendPath('fstg', params.fstg);

    // Append query params
    const appendQuery = (key: string, value?: string) => {
        if (value && value.trim() !== '') {
            urlObj.searchParams.set(key, value.trim());
        }
    };

    appendQuery('utm_source', params.utm_source);
    appendQuery('utm_medium', params.utm_medium);
    appendQuery('utm_campaign', params.utm_campaign);
    appendQuery('utm_term', params.utm_term);
    appendQuery('utm_content', params.utm_content);

    // If input didn't have protocol, remove it from output? 
    // Standard practice uses full URL. Let's assume input typically has protocol or user wants one.
    // If the original input didn't have protocol, the URL constructor added 'https://'.
    // We'll return the full href string.

    // Decoding the path is important? URL.pathname encodes characters like '=' to '%3D' in some envs? 
    // No, pathname properties usually don't encode '='. 
    // However, `toString()` might. 
    // Let's return urlObj.toString().
    // Wait, standard `URL` might percent-encode specific chars in pathname.
    // The user wants `/fid=1`. 
    // Let's verify if URL object preserves this.

    // Correction: If user provides `domain.com` without protocol, we added https.
    // If original was just `domain.com`, we should probably return `https://domain.com...` anyway.

    // Final cleanup: remove trailing slash if it exists and we are at the root path, 
    // unless there are query params where the slash is before the question mark.
    // URL.toString() gives 'https://site.com/?q=1'. expected 'https://site.com?q=1'.

    // Create a regex to replace '/?' with '?' or remove trailing slash at end of string
    let finalUrl = urlObj.toString();

    if (urlObj.pathname === '/') {
        // Replace "com/?" with "com?" or "com/" with "com"
        // We can interpret this as: if the URL ends with '/', remove it.
        // If it contains '/?', replace with '?'.

        finalUrl = finalUrl.replace(/\/(\?|$)/, '$1');
    }

    return finalUrl;
}
