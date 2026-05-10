#!/bin/bash
# Test script for axiom-mono

echo "Running Axiom tests..."

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build packages
echo "Building packages..."
pnpm build

# Run type checks
echo "Running type checks..."
pnpm check

echo "Done!"