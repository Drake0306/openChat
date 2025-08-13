@echo off
echo ========================================
echo   OpenChat Setup Verification
echo ========================================
echo.

cd /d "%~dp0\.."

echo Checking required files...
echo.

if exist .env.local.example (
    echo ✓ .env.local.example found
) else (
    echo ❌ .env.local.example missing
)

if exist .env.local (
    echo ✓ .env.local found
) else (
    echo ⚠️  .env.local not found (will be created from example)
)

if exist docker-compose.yml (
    echo ✓ docker-compose.yml found
) else (
    echo ❌ docker-compose.yml missing
)

if exist package.json (
    echo ✓ package.json found
) else (
    echo ❌ package.json missing
)

if exist prisma\schema.prisma (
    echo ✓ prisma/schema.prisma found
) else (
    echo ❌ prisma/schema.prisma missing
)

echo.
echo Checking Docker...
docker version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is running
) else (
    echo ❌ Docker is not running
)

echo.
echo ========================================
echo   Setup verification complete!
echo ========================================
echo.
echo Current directory: %CD%
echo.
echo Contents:
dir /B | findstr /V "node_modules"
echo.
pause