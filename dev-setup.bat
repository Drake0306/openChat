@echo off
echo 🚀 Setting up development environment...
echo.

echo 🔄 Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma generate failed. Continuing anyway...
) else (
    echo ✅ Prisma client generated
)

echo 🔄 Applying database schema...
call npx prisma db push
if errorlevel 1 (
    echo ❌ Database push failed. Continuing anyway...
) else (
    echo ✅ Database schema applied
)

echo 🔄 Running database seeds...
call npx tsx prisma/seed.ts
if errorlevel 1 (
    echo ❌ Seeding failed. Continuing anyway...
) else (
    echo ✅ Database seeded
)

echo.
echo ✅ Development environment setup complete!
echo 🎉 You can now start the development server with: npm run dev
echo.
pause