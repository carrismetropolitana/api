#!/bin/sh

echo "→ Starting cleanup..."
echo ""

# # #

echo "→ Removing 'node_modules' directories..."
find . -type d -name "node_modules" -prune | xargs rm -rf
echo "✓ Done"
echo ""

echo "→ Removing 'dist' directories..."
find . -type d -name "dist" -prune | xargs rm -rf
echo "✓ Done"
echo ""

echo "→ Removing '.next' directories..."
find . -type d -name ".next" -prune | xargs rm -rf
echo "✓ Done"
echo ""

echo "→ Removing '.turbo' directories..."
find . -type d -name ".turbo" -prune | xargs rm -rf
echo "✓ Done"
echo ""

echo "→ Removing '.source' directories..."
find . -type d -name ".source" -prune | xargs rm -rf
echo "✓ Done"
echo ""

# # #

echo "→ Removing 'pnpm-lock.yaml' files..."
find . -type f -name "pnpm-lock.yaml" | xargs rm -f
echo "✓ Done"
echo ""

echo "→ Removing 'package-lock.json' files..."
find . -type f -name "package-lock.json" | xargs rm -f
echo "✓ Done"
echo ""

# # #

echo "✓ Cleanup complete!"
echo ""