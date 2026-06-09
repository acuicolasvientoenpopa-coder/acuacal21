@echo off
cd /d "%~dp0"
echo.
echo  ^>^>^> Iniciando AquaCalc ...
echo.
start http://localhost:5173
npm run dev
pause
