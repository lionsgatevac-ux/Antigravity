@echo off
cd /d "%~dp0"
echo ==========================================
echo Email Gyujto Teszt Inditasa
echo ==========================================
echo.
echo A gyujtes indul... (kilepeshez nyomj Ctrl+C-t)
echo Az eredmeny a 'emails.csv' fajlba kerul.
echo.

scrapy crawl email_spider -O emails.csv

echo.
echo ==========================================
echo A gyujtes befejezodott!
echo Ellenorizd a 'emails.csv' fajlt.
echo ==========================================
pause
