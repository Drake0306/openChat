#!/bin/bash

echo "========================================"
echo "   OpenChat Setup Verification"
echo "========================================"
echo

cd "$(dirname "$0")/.."

echo "Checking required files..."
echo

if [ -f .env.local.example ]; then
    echo "✅ .env.local.example found"
else
    echo "❌ .env.local.example missing"
fi

if [ -f .env.local ]; then
    echo "✅ .env.local found"
else
    echo "⚠️  .env.local not found (will be created from example)"
fi

if [ -f docker-compose.yml ]; then
    echo "✅ docker-compose.yml found"
else
    echo "❌ docker-compose.yml missing"
fi

if [ -f package.json ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing"
fi

if [ -f prisma/schema.prisma ]; then
    echo "✅ prisma/schema.prisma found"
else
    echo "❌ prisma/schema.prisma missing"
fi

echo
echo "Checking Docker..."
if docker version >/dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
fi

echo
echo "========================================"
echo "   Setup verification complete!"
echo "========================================"
echo
echo "Current directory: $(pwd)"
echo
echo "Contents:"
ls -la | grep -v node_modules
echo