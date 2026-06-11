@echo off
title AcuiCal Deploy Panel
cd /d "%~dp0"
echo Iniciando AcuiCal Deploy Panel...
start "" http://localhost:3456
node tools\server.mjs
pause
