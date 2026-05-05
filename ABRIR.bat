@echo off
chcp 65001 > nul
title HIT Platform

:: ── Verificar se setup já foi feito ──────────────────────────────────────────
:: O critério confiável: node_modules do backend existem
if exist "%~dp0backend\node_modules\" goto :iniciar

:: ── SETUP — primeira vez ──────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║     HIT Platform — Primeira configuração         ║
echo ║         Aguarde cerca de 5 minutos               ║
echo ╚══════════════════════════════════════════════════╝
echo.

echo [1/6] Verificando Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: Node.js nao encontrado.
    echo  Baixe em: https://nodejs.org  (versao LTS^)
    echo  Apos instalar, execute este arquivo novamente.
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo     OK - Node.js %NODE_VER%

echo.
echo [2/6] Localizando PostgreSQL...
set PSQL=
for %%V in (18 17 16 15 14) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        set PSQL=C:\Program Files\PostgreSQL\%%V\bin\psql.exe
        echo     OK - PostgreSQL %%V
        goto :psql_ok
    )
)
where psql > nul 2>&1
if %errorlevel% equ 0 ( set PSQL=psql & echo     OK - PostgreSQL no PATH & goto :psql_ok )
echo.
echo  ERRO: PostgreSQL nao encontrado.
echo  Baixe em: https://www.postgresql.org/download/windows/
echo  Apos instalar, execute este arquivo novamente.
echo.
pause & exit /b 1
:psql_ok

echo.
echo [3/6] Configurando banco de dados...
set /p PG_PASS=     Senha do usuario postgres:
set PGPASSWORD=%PG_PASS%
"%PSQL%" -U postgres -c "SELECT 1" > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: Senha incorreta ou PostgreSQL parado.
    echo  Verifique o servico "postgresql-x64-XX" no Windows.
    echo.
    pause & exit /b 1
)
echo     OK - Conectado
"%PSQL%" -U postgres -c "CREATE DATABASE hitplatform;" > nul 2>&1
echo     OK - Banco pronto

echo.
echo [4/6] Criando arquivo de configuracao...
(
echo DATABASE_URL="postgresql://postgres:%PG_PASS%@localhost:5432/hitplatform"
echo JWT_SECRET="hit-platform-jwt-secret-2026-very-secure"
echo JWT_REFRESH_SECRET="hit-platform-refresh-secret-2026-very-secure"
echo CLIENT_URL="http://localhost:5175"
echo PORT=3001
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=seu@email.com
echo SMTP_PASS=
echo SMTP_FROM="HIT Platform"
) > "%~dp0backend\.env"
echo     OK

echo.
echo [5/6] Instalando dependencias (aguarde)...
cd "%~dp0backend"
call npm install --silent 2>nul
cd "%~dp0frontend"
call npm install --silent 2>nul
echo     OK

echo.
echo [6/6] Criando tabelas e dados...
cd "%~dp0backend"
call npx prisma migrate deploy > nul 2>&1
if %errorlevel% neq 0 (
    call npx prisma migrate dev --name init --skip-seed > nul 2>&1
)
call npx ts-node prisma/seed.ts
echo     OK

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║   Configuracao concluida! Abrindo o site...      ║
echo ╚══════════════════════════════════════════════════╝
echo.
timeout /t 2 /nobreak > nul

:: ── INICIAR ───────────────────────────────────────────────────────────────────
:iniciar

:: Liberar portas caso estejam ocupadas por instâncias anteriores
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 "') do (
    taskkill /PID %%a /F > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5175 "') do (
    taskkill /PID %%a /F > nul 2>&1
)
timeout /t 1 /nobreak > nul

echo.
echo  Iniciando backend...
start "HIT Backend" /D "%~dp0backend" cmd /k npm run dev
timeout /t 5 /nobreak > nul

echo  Iniciando frontend...
start "HIT Frontend" /D "%~dp0frontend" cmd /k npm run dev
timeout /t 7 /nobreak > nul

echo  Abrindo navegador...
start "" "http://localhost:5175"

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  Plataforma no ar!  http://localhost:5175        ║
echo ╠══════════════════════════════════════════════════╣
echo ║  Admin:  diego@hithammers.com  /  admin1234@     ║
echo ╠══════════════════════════════════════════════════╣
echo ║  Para encerrar: feche as janelas                 ║
echo ║  "HIT Backend"  e  "HIT Frontend"               ║
echo ╚══════════════════════════════════════════════════╝
echo.
pause
