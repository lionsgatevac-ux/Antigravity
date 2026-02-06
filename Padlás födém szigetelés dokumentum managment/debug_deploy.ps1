# Debug Deploy Script
$PROJECT_ID = "padlas-fodem-szigeteles"
$SERVICE_NAME = "padlas-fodem-szigeteles"
$REGION = "europe-west1"
$IMAGE_NAME = "europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"
$VERSION = "v46_floorplan_fix"

# Define Environment Variables (One continuous string with comma separation)
$ENV_VARS = "NODE_ENV=production," +
"PORT=8080," +
"FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app," +
"CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app," +
"SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co," +
"SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY," +
"DATABASE_URL=postgresql://postgres.pkjohziwbiiyzyospuot:Biznisz%20matek@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

Write-Host "🚀 Retry Deploying with DATABASE_URL included..."
Write-Host "Environment Variables Length: $($ENV_VARS.Length)"

# Deploy command
gcloud run deploy $SERVICE_NAME `
    --image "${IMAGE_NAME}:${VERSION}" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --set-env-vars "$ENV_VARS" 2>&1 | Tee-Object -FilePath "deploy_debug_log.txt"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment Failed. Check deploy_debug_log.txt"
    exit 1
}
Write-Host "✅ Deployment Success! Service updated."
