#!/bin/bash
# Verify build script for Axiom
set -e

echo "Verifying build..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

FAILED=0

# Check TypeScript compilation
echo -n "Checking TypeScript compilation... "
if pnpm check > /dev/null 2>&1; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

# Check build
echo -n "Checking build... "
if pnpm build > /dev/null 2>&1; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

# Check dist directory exists
echo -n "Checking dist directory... "
if [ -d "packages/coding-agent/dist" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

# Check main binary exists
echo -n "Checking main binary... "
if [ -f "packages/coding-agent/dist/main.js" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

# Check migrations copied
echo -n "Checking migrations... "
if [ -d "packages/coding-agent/dist/storage/migrations" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

# Check package structure
echo -n "Checking package.json... "
if grep -q '"main"' packages/coding-agent/package.json && \
   grep -q '"types"' packages/coding-agent/package.json && \
   grep -q '"bin"' packages/coding-agent/package.json; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}Some checks failed!${NC}"
  exit 1
fi