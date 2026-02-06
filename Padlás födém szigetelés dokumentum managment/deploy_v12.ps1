$PROJECT_ID = "padlas-fodem-szigeteles"
$SERVICE_NAME = "padlas-fodem-szigeteles"
$REGION = "europe-west1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
$VERSION = "v12-floorplan-fix"

Write-Host "🚀 Starting Cloud Run Deployment ($VERSION)..."

# Step 1: Build & Submit to GCR
Write-Host "🔨 Building and Pushing image (gcloud builds submit)..."
gcloud builds submit --tag "${IMAGE_NAME}:${VERSION}" --timeout=15m .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!"
    exit 1
}

# Step 2: Deploy
Write-Host "🚢 Deploying to Cloud Run..."
$ENV_VARS = "NODE_ENV=production,PORT=8080,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app"

gcloud run deploy $SERVICE_NAME --image "${IMAGE_NAME}:${VERSION}" --platform managed --region $REGION --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --set-env-vars "$ENV_VARS"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!"
    exit 1
}

Write-Host "✅ Deployment successful!"
Write-Host "🌐 Service URL: https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app"
