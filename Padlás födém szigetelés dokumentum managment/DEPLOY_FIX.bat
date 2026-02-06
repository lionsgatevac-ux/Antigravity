@echo off
set PROJECT_ID=padlas-fodem-szigeteles
set SERVICE_NAME=padlas-fodem-szigeteles
set REGION=europe-west1
set IMAGE_NAME=europe-west1-docker.pkg.dev/%PROJECT_ID%/cloud-run-source-deploy/%SERVICE_NAME%
set VERSION=v49_final_fix

echo "🚀 STARTING FINAL DEPLOYMENT (BAT)..."

call gcloud run deploy %SERVICE_NAME% --image "%IMAGE_NAME%:%VERSION%" --platform managed --region %REGION% --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --set-env-vars "NODE_ENV=production,PORT=8080,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co,SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY,DATABASE_URL=postgresql://postgres.pkjohziwbiiyzyospuot:Biznisz%20matek@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

if %ERRORLEVEL% NEQ 0 (
    echo "❌ Deployment Failed!"
    exit /b 1
)
echo "✅ Deployment Success!"
