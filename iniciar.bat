@echo off
cd /d "%~dp0"
echo.
echo  ^>^>^> Iniciando AquaCalc ...
echo.
echo  Para acceder desde el celular:
echo  1. Conectate a la MISMA red WiFi
echo  2. Busca tu IP local con: ipconfig ^| findstr "IPv4"
echo  3. Abri en el celular: http://TUPUERTO:5173
echo.
start http://localhost:5173
npm run dev
pause
