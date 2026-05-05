@echo off
chcp 65001 > nul
title HIT Platform

echo.
echo  Iniciando HIT Platform...
echo.

start "HIT Backend" /D "%~dp0backend" cmd /k npm run dev
timeout /t 5 /nobreak > nul

start "HIT Frontend" /D "%~dp0frontend" cmd /k npm run dev
timeout /t 7 /nobreak > nul

start "" "http://localhost:5175"

echo.
echo  Plataforma no ar: http://localhost:5175
echo  Login: diego@hithammers.com / admin1234@
echo.
echo  Para encerrar: feche as janelas HIT Backend e HIT Frontend
echo.
pause
