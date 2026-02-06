@echo off
set PROJECT_ID=padlas-fodem-szigeteles
set SERVICE_NAME=padlas-fodem-szigeteles
set REGION=europe-west1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%
set VERSION=v12-floorplan-fix

echo STARING Cloud Run Deployment (%VERSION%)...

echo Building and Pushing image (gcloud builds submit)...
call gcloud builds submit --tag "%IMAGE_NAME%:%VERSION%" --timeout=15m .
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)

echo Deploying to Cloud Run...
set ENV_VARS=NODE_ENV=production,FRONTEND_URL=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app,CORS_ORIGIN=https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app

call gcloud run deploy %SERVICE_NAME% ^
    --image "%IMAGE_NAME%:%VERSION%" ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --memory 2Gi ^
    --cpu 2 ^
    --timeout 300 ^
    --max-instances 10 ^
    --set-env-vars "%ENV_VARS%"

if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed!
    exit /b 1
)

echo Deployment successful!
echo Service URL: https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app
