import https from 'https';
import { URL } from 'url';

const WORKER_URL = 'https://ab-redirect.ferramentas-bce.workers.dev';
// Ensure this path exists or pick a random active slug
const TEST_PATHS = ['/fbi3iuda', '/ori2', '/pgori1'];

// Fake User Agents to simulate different devices
const USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
];

async function makeRequest(id) {
    const path = TEST_PATHS[Math.floor(Math.random() * TEST_PATHS.length)];
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const randomFbc = `fb.1.${Date.now()}.${Math.floor(Math.random() * 100000000)}`;
    const randomFbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 100000000)}`;

    const url = new URL(path, WORKER_URL);
    // Add some query params
    url.searchParams.append('utm_source', 'load_test');
    url.searchParams.append('utm_id', `test-${id}`);
    url.searchParams.append('fbclid', randomFbc.split('.').pop()); // Send fbclid so worker processes it

    const options = {
        method: 'GET',
        headers: {
            'User-Agent': ua,
            'Cookie': `_fbp=${randomFbp}; _fbc=${randomFbc}`
        }
    };

    return new Promise((resolve) => {
        const start = Date.now();
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                console.log(`[Req ${id}] Status: ${res.statusCode} | Time: ${duration}ms | Path: ${path} | UA: ${ua.substring(0, 20)}...`);
                resolve({ id, status: res.statusCode, duration });
            });
        });

        req.on('error', (e) => {
            console.error(`[Req ${id}] Error: ${e.message}`);
            resolve({ id, status: 'error', duration: 0 });
        });

        req.end();
    });
}

async function runLoadTest(totalRequests = 50, concurrency = 5) {
    console.log(`🚀 Starting Load Test: ${totalRequests} requests (Concurrency: ${concurrency})`);
    console.log(`🎯 Target: ${WORKER_URL}`);
    console.log('------------------------------------------------');

    const results = [];
    const queue = Array.from({ length: totalRequests }, (_, i) => i + 1);

    while (queue.length > 0) {
        const batch = queue.splice(0, concurrency);
        const promises = batch.map(id => makeRequest(id));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
    }

    console.log('------------------------------------------------');
    console.log('✅ Load Test Complete');

    // Stats
    const successful = results.filter(r => r.status >= 200 && r.status < 400).length;
    const errors = results.filter(r => r.status === 'error' || r.status >= 400).length;
    const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

    console.log(`📊 Summary:`);
    console.log(`   Success: ${successful}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Avg Latency: ${avgDuration.toFixed(2)}ms`);
}

// Run 20 requests
runLoadTest(20, 5);
