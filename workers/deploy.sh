#!/bin/bash
# Deploy GTM Workers para Cloudflare
# Execute: ./workers/deploy.sh

set -e

echo "🚀 Deploying GTM Workers to Cloudflare..."

cd "$(dirname "$0")"

# Deploy Producer
echo ""
echo "📤 Deploying gtm-producer..."
wrangler deploy --config wrangler.producer.jsonc

# Deploy Consumer
echo ""
echo "📥 Deploying gtm-consumer..."
wrangler deploy --config wrangler.consumer.jsonc

echo ""
echo "✅ Deploy complete!"
echo ""
echo "⚠️  Lembre-se de configurar os secrets:"
echo "   wrangler secret put GTM_SECRET --config wrangler.producer.jsonc"
echo "   wrangler secret put SUPABASE_URL --config wrangler.consumer.jsonc"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.consumer.jsonc"
