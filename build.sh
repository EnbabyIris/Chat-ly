#!/bin/bash
set -e

echo "Installing pnpm..."
npm install -g pnpm@9.1.0

echo "Installing dependencies with pnpm..."
pnpm install --no-frozen-lockfile

echo "Building shared packages..."
pnpm run build --filter=@repo/shared
pnpm run build --filter=@repo/ui

echo "Building API..."
pnpm run build --filter=api

echo "Build completed successfully!"