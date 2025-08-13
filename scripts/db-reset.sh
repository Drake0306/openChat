#!/bin/bash

echo "========================================"
echo "   OpenChat Database Reset"
echo "========================================"
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "⚠️  WARNING: This will reset your database and delete all data!"
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo
echo "Step 1: Stopping containers..."
docker-compose down

echo "Step 2: Removing database volume..."
docker volume rm openchat_postgres_data 2>/dev/null || true

echo "Step 3: Starting fresh containers..."
docker-compose up -d

echo
echo "Step 4: Waiting for database to be ready..."
sleep 15

echo "Step 5: Running database migrations..."
docker-compose exec nextjs-dev npx prisma db push
docker-compose exec nextjs-dev npx prisma generate

echo
echo "========================================"
echo "   ✅ Database reset complete!"
echo "========================================"
echo
echo "The database has been reset with a fresh schema."
echo "You can now use the demo account or create new users."
echo