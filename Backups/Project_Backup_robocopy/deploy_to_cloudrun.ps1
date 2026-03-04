# PowerShell Deployment Script for Cloud Run
# Run this script from the project root directory

Write-Host "🚀 Starting Cloud Run Deployment..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "padlas-fodem-szigeteles"
$SERVICE_NAME = "padlas-fodem-szigeteles"
$REGION = "europe-west1"
$IMAGE_NAME = "europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"
$VERSION = "v45_energy_fix"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Project ID: $PROJECT_ID"
Write-Host "   Service: $SERVICE_NAME"
Write-Host "   Region: $REGION"
Write-Host "   Image: ${IMAGE_NAME}:${VERSION}"
Write-Host ""

# Step 1 & 2: Build and Push with Cloud Build
Write-Host "🔨 Step 1 & 2: Building and Pushing with Cloud Build..." -ForegroundColor Cyan
# Using gcloud builds submit to avoid local docker auth issues
gcloud builds submit --tag "${IMAGE_NAME}:${VERSION}" .
# We also tag as latest for convenience? Cloud Build doesn't do multiple tags easily in one go standardly without config, 
# but we can omit latest or just retag. The deploy uses specific version.

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image built and pushed successfully via Cloud Build" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy to Cloud Run (proceeds below)

# Step 3: Deploy to Cloud Run
Write-Host "🚢 Step 3: Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
    --image "${IMAGE_NAME}:${VERSION}" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --set-env-vars "NODE_ENV=production,PORT=8080,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co,SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Service URL: https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
Write-Host "   2. Test the application at the URL above"
Write-Host "   3. Verify LibreOffice functionality by generating a document"
Write-Host ""
