#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 1/3 Installing root backend dependencies..."
npm install

echo "📦 2/3 Installing frontend dependencies..."
npm install --prefix frontend

echo "⚡ 3/3 Building Vite React client..."
npm run build --prefix frontend

echo "✅ Build completed successfully! Assets compiled into frontend/dist."
