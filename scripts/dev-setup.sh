#!/bin/bash

echo "========================================"
echo "   OpenChat Development Setup"
echo "========================================"
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "Step 1: Creating environment file..."
cd "$(dirname "$0")/.."
if [ ! -f .env.local ]; then
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from example"
        echo "⚠️  Please edit .env.local with your actual API keys before continuing"
        echo
    else
        echo "❌ ERROR: .env.local.example not found in project root"
        echo "Current directory: $(pwd)"
        ls -la .env* 2>/dev/null || echo "No .env files found"
        exit 1
    fi
else
    echo "✅ .env.local already exists"
fi

echo "Step 2: Building and starting Docker containers..."
docker-compose down --remove-orphans --volumes
docker-compose build --no-cache
docker-compose up -d

echo
echo "Step 3: Waiting for database to be ready..."
sleep 10

echo "Step 4: Running database migrations..."
docker-compose exec nextjs-dev npx prisma db push
docker-compose exec nextjs-dev npx prisma generate

echo
echo "========================================"
echo "   ✅ Development setup complete!"
echo "========================================"
echo
echo "🌐 Application: http://localhost:3000"
echo "📊 Database: localhost:5432"
echo
echo "Demo credentials:"
echo "   📧 Email: demo@example.com"
echo "   🔑 Password: password"
echo
echo "To stop the application:"
echo "   docker-compose down"
echo
echo "To view logs:"
echo "   docker-compose logs -f"
echo