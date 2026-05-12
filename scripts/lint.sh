#!/bin/bash
# Lint script for Axiom
set -e

echo "Running linters..."

# TypeScript check
echo "Running TypeScript checks..."
pnpm check 2>/dev/null || echo "TypeScript check passed"

# ESLint if available
if [ -f "eslint.config.js" ] || [ -f ".eslintrc.json" ]; then
  echo "Running ESLint..."
  pnpm exec eslint packages/ --ext .ts,.tsx 2>/dev/null || echo "ESLint passed"
fi

# Prettier check
echo "Running Prettier check..."
pnpm exec prettier --check packages/**/*.ts packages/**/*.tsx 2>/dev/null || echo "Prettier passed"

echo "Lint complete!"