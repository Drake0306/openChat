@echo off
echo ========================================
echo   OpenChat Cleanup
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo This will stop all containers, remove volumes, and clean up Docker images.
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Stopping and removing containers...
docker-compose down --remove-orphans

echo Step 2: Removing volumes...
docker volume rm openchat_postgres_data 2>nul

echo Step 3: Removing Docker images...
docker rmi openchat:production 2>nul
docker rmi openchat_nextjs-dev 2>nul

echo Step 4: Cleaning up unused Docker resources...
docker system prune -f

echo.
echo ========================================
echo   ✅ Cleanup complete!
echo ========================================
echo.
echo All OpenChat containers, volumes, and images have been removed.
echo To start fresh, run the dev-setup script again.
echo.
pause