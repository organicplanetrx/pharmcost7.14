#!/bin/sh
set -e

echo "Starting PharmaCost Pro on Railway..."
echo "Node version: $(node --version)"

# Check if built file exists
if [ ! -f "dist/index.js" ]; then
    echo "Error: Built application not found at dist/index.js"
    ls -la dist/ || echo "dist directory not found"
    exit 1
fi

echo "Starting server with node dist/index.js..."
node dist/index.js