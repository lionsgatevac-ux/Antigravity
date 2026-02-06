@echo off
echo Cloud Run Startup Fix - Updating Environment Variables...
echo ========================================================

set SERVICE_NAME=padlas-fodem-szigeteles
set REGION=europe-west1
set SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co
set SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBram9oeml3YmlpeXp5b3NwdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDQ0OTcsImV4cCI6MjA4MDYyMDQ5N30.Q35HTntIe_yTKyAYvYDIDvrPqIiz4WyZYzWHKfFiJZY

echo Target Service: %SERVICE_NAME%
echo Region: %REGION%
echo.
echo Setting SUPABASE_URL and SUPABASE_KEY...

call gcloud run services update %SERVICE_NAME% ^
  --region=%REGION% ^
  --update-env-vars=SUPABASE_URL=%SUPABASE_URL%,SUPABASE_KEY=%SUPABASE_KEY%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Environment variables updated! 
    echo The service should create a new revision and start correctly now.
) else (
    echo.
    echo ERROR: Failed to update service. Please check your gcloud authentication.
)
pause
