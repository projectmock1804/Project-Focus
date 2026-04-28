#!/bin/bash

# Project Focus - Automated Deployment Script
# This script prepares everything for Render deployment

set -e  # Exit on error

echo "🚀 Project Focus Deployment Preparation"
echo "========================================"
echo ""

# Check if on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Error: Must be on 'main' branch. Currently on '$BRANCH'"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "❌ Error: Uncommitted changes detected. Commit or stash them first."
  git status
  exit 1
fi

echo "✅ On main branch with no uncommitted changes"
echo ""

# Build frontend
echo "📦 Building frontend..."
cd src/web
npm install --production
npm run build
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "✅ Frontend built successfully (size: $BUILD_SIZE)"
cd ../..
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production
echo "✅ Backend dependencies installed"
echo ""

# Show git status
echo "📊 Git Status:"
echo "---"
COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD)
echo "Commits ahead of origin/main: $COMMITS_AHEAD"
echo ""

# Environment check
echo "🔐 Environment Variables Check:"
echo "---"
if [ -f .env ]; then
  echo "✅ .env file exists"
  if grep -q "FIREBASE_SERVICE_ACCOUNT" .env; then
    echo "✅ FIREBASE_SERVICE_ACCOUNT is set"
  else
    echo "⚠️  FIREBASE_SERVICE_ACCOUNT not found in .env"
    echo "   (Required for production deployment)"
  fi
else
  echo "❌ .env file not found"
  echo "   Copy from .env.example and fill in values"
fi
echo ""

# Summary
echo "📋 Deployment Readiness Summary:"
echo "================================"
echo "✅ Code compiled successfully"
echo "✅ Dependencies installed"
echo "✅ Frontend build size: $BUILD_SIZE"
echo "✅ Git history clean"
echo ""

echo "🎯 Next Steps:"
echo "1. Ensure .env has FIREBASE_SERVICE_ACCOUNT set"
echo "2. Go to https://dashboard.render.com"
echo "3. Create new Web Service from GitHub"
echo "4. Set environment variables from .env"
echo "5. Deploy!"
echo ""

echo "📚 For detailed instructions, see: DEPLOYMENT.md"
echo ""
echo "✨ Ready for deployment!"
