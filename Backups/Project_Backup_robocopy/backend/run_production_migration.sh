#!/bin/bash

# Run migration on Cloud Run service
echo "🚀 Running production database migration..."

# Execute migration script on Cloud Run
gcloud run jobs create materials-migration \
  --image gcr.io/padlas-fodem-szigeteles/padlas-szigeteles-app \
  --region europe-west3 \
  --project padlas-fodem-szigeteles \
  --command "node" \
  --args "migrate_production.js" \
  --set-env-vars-file .env.production

echo "✅ Migration job created"
