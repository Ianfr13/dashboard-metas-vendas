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

# Deploy Facebook Worker (Sync)
echo ""
echo "📘 Deploying facebook-worker..."
wrangler deploy --config wrangler.facebook.jsonc

# Deploy A/B Redirect (CMS)
echo ""
echo "🔀 Deploying ab-redirect..."
wrangler deploy --config wrangler.ab-redirect.jsonc

echo ""
echo "✅ Deploy complete!"
echo ""
echo "⚠️  Lembre-se de configurar os secrets:"
echo "   Consumer/Producer:"
echo "     wrangler secret put GTM_SECRET --config wrangler.producer.jsonc"
echo "     wrangler secret put SUPABASE_URL --config wrangler.consumer.jsonc"
echo "     wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.consumer.jsonc"
echo "   Facebook Worker:"
echo "     wrangler secret put FACEBOOK_ACCESS_TOKEN --config wrangler.facebook.jsonc"
echo "     wrangler secret put FACEBOOK_APP_ID --config wrangler.facebook.jsonc"
echo "     wrangler secret put FACEBOOK_APP_SECRET --config wrangler.facebook.jsonc"
echo "     wrangler secret put SUPABASE_URL --config wrangler.facebook.jsonc"
echo "     wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.facebook.jsonc"
