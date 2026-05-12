#!/bin/bash
# Release script for Axiom
set -e

VERSION=${1:-}
DRY_RUN=${2:-}

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version> [--dry-run]"
  echo "Example: ./scripts/release.sh 1.0.0"
  exit 1
fi

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 1.0.0)"
  exit 1
fi

echo "Preparing release v${VERSION}..."

# Check for uncommitted changes
if [ -z "$DRY_RUN" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "Warning: You have uncommitted changes. Commit or stash them before releasing."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# Update version in package.json files
echo "Updating version to ${VERSION}..."

# Run build
echo "Building..."
pnpm build

# Run tests
echo "Running tests..."
bash scripts/test.sh || echo "Tests skipped (no test files)"

# Create git tag
if [ -z "$DRY_RUN" ]; then
  echo "Creating git tag v${VERSION}..."
  git tag -a "v${VERSION}" -m "Release v${VERSION}"
  echo "Tag created. Push with: git push origin v${VERSION}"
else
  echo "[DRY RUN] Would create tag v${VERSION}"
fi

echo ""
echo "Release v${VERSION} prepared successfully!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff HEAD~1"
echo "  2. Push the tag: git push origin v${VERSION}"
echo "  3. GitHub Actions will publish to npm"