@echo off
echo ========================================
echo   OpenChat Development Setup
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 1: Creating environment file...
cd /d "%~dp0\.."
if not exist .env.local (
    if exist .env.local.example (
        copy .env.local.example .env.local
        echo ✓ Created .env.local from example
        echo ! Please edit .env.local with your actual API keys before continuing
        echo.
    ) else (
        echo ERROR: .env.local.example not found in project root
        echo Current directory: %CD%
        dir .env* 2>nul
        pause
        exit /b 1
    )
) else (
    echo ✓ .env.local already exists
)

echo Step 2: Building and starting Docker containers...
docker-compose down --remove-orphans --volumes
docker-compose build --no-cache
docker-compose up -d

echo.
echo Step 3: Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo Step 4: Running database migrations...
docker-compose exec nextjs-dev npx prisma db push
docker-compose exec nextjs-dev npx prisma generate

echo.
echo ========================================
echo   ✅ Development setup complete!
echo ========================================
echo.
echo 🌐 Application: http://localhost:3000
echo 📊 Database: localhost:5432
echo.
echo Demo credentials:
echo   📧 Email: demo@example.com
echo   🔑 Password: password
echo.
echo To stop the application:
echo   docker-compose down
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
pause