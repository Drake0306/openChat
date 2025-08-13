#!/bin/bash

echo "========================================"
echo "   OpenChat Production Build"
echo "========================================"
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "Step 1: Navigating to project root..."
cd "$(dirname "$0")/.."

echo "Step 2: Building production Docker image..."
docker build -f Dockerfile.prod -t openchat:production .

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Production build failed"
    echo "Current directory: $(pwd)"
    echo "Checking for Dockerfile.prod..."
    if [ -f Dockerfile.prod ]; then
        echo "✅ Dockerfile.prod found"
    else
        echo "❌ Dockerfile.prod not found"
        ls -la | grep Dockerfile
    fi
    exit 1
fi

echo
echo "Step 3: Creating production environment..."
if [ ! -f .env.production ]; then
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.production
        echo "✅ Created .env.production from example"
        echo "⚠️  Please edit .env.production with your production values"
    fi
fi

echo
echo "========================================"
echo "   ✅ Production build complete!"
echo "========================================"
echo
echo "Docker image: openchat:production"
echo
echo "To run in production mode:"
echo "   docker run -p 3000:3000 --env-file .env.production openchat:production"
echo
echo "Or with docker-compose:"
echo "   docker-compose -f docker-compose.prod.yml up"
echo