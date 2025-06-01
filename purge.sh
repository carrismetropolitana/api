#!/bin/sh

echo "Starting purge..."

find . -type d \( -name "node_modules" -o -name ".next" -o -name "dist" -o -name ".turbo" \) -prune -exec rm -rf {} +

find . -type f -name "package-lock.json" -exec rm -f {} +

echo "Purge complete!"