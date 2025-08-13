#!/bin/bash

echo "========================================"
echo "   OpenChat Cleanup"
echo "========================================"
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "⚠️  This will stop all containers, remove volumes, and clean up Docker images."
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo
echo "Step 1: Stopping and removing containers..."
docker-compose down --remove-orphans

echo "Step 2: Removing volumes..."
docker volume rm openchat_postgres_data 2>/dev/null || true

echo "Step 3: Removing Docker images..."
docker rmi openchat:production 2>/dev/null || true
docker rmi openchat_nextjs-dev 2>/dev/null || true

echo "Step 4: Cleaning up unused Docker resources..."
docker system prune -f

echo
echo "========================================"
echo "   ✅ Cleanup complete!"
echo "========================================"
echo
echo "All OpenChat containers, volumes, and images have been removed."
echo "To start fresh, run the dev-setup script again."
echo