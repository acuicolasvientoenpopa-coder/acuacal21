@echo off
title AcuiCal — Build + Deploy
echo === AcuiCal Build ===
echo.

call npm run build
if %errorlevel% neq 0 (
  echo ERROR: Build fallo
  pause
  exit /b %errorlevel%
)

echo.
echo Build exitoso!
echo.
echo === PASO 1: Arrastra la carpeta "dist" a Netlify ===
echo URL: https://app.netlify.com/sites/acuacla2112/deploys
echo.
explorer dist
pause
