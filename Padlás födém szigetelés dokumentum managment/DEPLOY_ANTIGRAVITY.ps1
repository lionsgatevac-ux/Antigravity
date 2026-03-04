$PROJECT_ID = 'padlas-fodem-szigeteles'
$SERVICE_NAME = 'padlas-fodem-szigeteles'
$REGION = 'europe-west1'
$IMAGE_NAME = "europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"
$VERSION = 'v55_antigravity'

Write-Host "🚀 STARTING ANTIGRAVITY DEPLOYMENT (v55)..." -ForegroundColor Green

# Build
Write-Host "🔨 Building Container..." -ForegroundColor Yellow
gcloud builds submit --tag "${IMAGE_NAME}:${VERSION}" --timeout=15m .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build Failed!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Yellow

$DB_URL = 'postgresql://postgres.pkjohziwbiiyzyospuot:Biznisz%20matek@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'

$ENV_VARS_LIST = @(
    'NODE_ENV=production',
    'JWT_SECRET=padlas_secure_jwt_secret_2024',
    'FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app',
    'CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app',
    'SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co',
    'SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY',
    "DATABASE_URL=$DB_URL"
)

$ENV_VARS_STRING = $ENV_VARS_LIST -join ","

# Using single line to avoid PowerShell parser issues with backticks
gcloud run deploy $SERVICE_NAME --image "${IMAGE_NAME}:${VERSION}" --platform managed --region $REGION --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --set-env-vars $ENV_VARS_STRING 2>&1 | Tee-Object -FilePath "deploy_antigravity_log.txt"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment Failed! Check deploy_antigravity_log.txt" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment Success!" -ForegroundColor Green
