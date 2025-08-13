@echo off
echo ========================================
echo   OpenChat Production Build
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 1: Navigating to project root...
cd /d "%~dp0\.."

echo Step 2: Building production Docker image...
docker build -f Dockerfile.prod -t openchat:production .

if %errorlevel% neq 0 (
    echo ERROR: Production build failed
    echo Current directory: %CD%
    echo Checking for Dockerfile.prod...
    if exist Dockerfile.prod (
        echo ✓ Dockerfile.prod found
    ) else (
        echo ❌ Dockerfile.prod not found
    )
    pause
    exit /b 1
)

echo.
echo Step 3: Creating production environment...
if not exist .env.production (
    if exist .env.local.example (
        copy .env.local.example .env.production
        echo ✓ Created .env.production from example
        echo ! Please edit .env.production with your production values
    )
)

echo.
echo ========================================
echo   ✅ Production build complete!
echo ========================================
echo.
echo Docker image: openchat:production
echo.
echo To run in production mode:
echo   docker run -p 3000:3000 --env-file .env.production openchat:production
echo.
echo Or with docker-compose:
echo   docker-compose -f docker-compose.prod.yml up
echo.
pause