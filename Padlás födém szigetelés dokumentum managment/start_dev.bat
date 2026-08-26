@echo off
echo Starting Padlas Fodem Szigeteles System...

start "Backend Server" /D "c:\Users\Admin\OneDrive\Asztali gép\Antigravity\Padlás födém szigetelés dokumentum managment\backend" cmd /k "npm run dev"
start "Frontend Client" /D "c:\Users\Admin\OneDrive\Asztali gép\Antigravity\Padlás födém szigetelés dokumentum managment\frontend" cmd /k "npm run dev"

echo System started! Check the new terminal windows.
pause
