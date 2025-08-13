@echo off
echo ========================================
echo   OpenChat Database Reset
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo WARNING: This will reset your database and delete all data!
set /p confirm="Are you sure you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Stopping containers...
docker-compose down

echo Step 2: Removing database volume...
docker volume rm openchat_postgres_data

echo Step 3: Starting fresh containers...
docker-compose up -d

echo.
echo Step 4: Waiting for database to be ready...
timeout /t 15 /nobreak >nul

echo Step 5: Running database migrations...
docker-compose exec nextjs-dev npx prisma db push
docker-compose exec nextjs-dev npx prisma generate

echo.
echo ========================================
echo   ✅ Database reset complete!
echo ========================================
echo.
echo The database has been reset with a fresh schema.
echo You can now use the demo account or create new users.
echo.
pause