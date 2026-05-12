#!/bin/bash
# Test script for Axiom
set -e

echo "Running tests..."

# Check if test files exist
if [ ! -d "packages" ]; then
  echo "No packages directory found"
  exit 1
fi

# Run tests if test script exists
if command -v pnpm &> /dev/null; then
  # Check each package for tests
  for pkg in packages/*/; do
    if [ -f "${pkg}package.json" ]; then
      name=$(basename "$pkg")
      echo "Checking $name..."
    fi
  done
fi

echo "Test setup complete. Add actual tests to test/ directories."
echo "Run individual tests with: pnpm test"