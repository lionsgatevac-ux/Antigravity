@echo off
set PROJECT_ID=padlas-fodem-szigeteles
set SERVICE_NAME=padlas-fodem-szigeteles
set REGION=europe-west1
set IMAGE_NAME=europe-west1-docker.pkg.dev/%PROJECT_ID%/cloud-run-source-deploy/%SERVICE_NAME%
set VERSION=v52_login_fix

echo "🚀 STARTING LOGIN FIX DEPLOYMENT..."

echo "🔨 Building Container..."
call gcloud builds submit --tag %IMAGE_NAME%:%VERSION% --timeout=15m .

if %ERRORLEVEL% NEQ 0 (
    echo "❌ Build Failed!"
    exit /b 1
)

echo "🚀 Deploying to Cloud Run..."
rem key change: Biznisz%%20matek  (escaped percent sign for batch file)
call gcloud run deploy %SERVICE_NAME% --image "%IMAGE_NAME%:%VERSION%" --platform managed --region %REGION% --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --set-env-vars "NODE_ENV=production,JWT_SECRET=padlas_secure_jwt_secret_2024,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co,SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY,DATABASE_URL=postgresql://postgres.pkjohziwbiiyzyospuot:Biznisz%%20matek@aws-1-eu-central-1.pooler.supabase.com:6543/postgres" > deploy_login_fix_log.txt 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo "❌ Deployment Failed! Check deploy_login_fix_log.txt"
    type deploy_login_fix_log.txt
    exit /b 1
)
echo "✅ Deployment Success!"
