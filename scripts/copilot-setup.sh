#!/bin/bash

# Copilot Development Setup Script
# This script demonstrates the typical development workflow for the Deno MCP Server project

echo "🚀 Setting up Deno MCP Server development environment for Copilot..."

# Check if we're in the right directory
if [ ! -f "deno.json" ] || [ ! -d "packages" ]; then
    echo "❌ Error: Please run this script from the root of the deno-mcp-server repository"
    exit 1
fi

echo "📁 Project structure validated"

# Setup Deno server
echo "🦕 Setting up Deno server..."
cd packages/server

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first: https://deno.land/manual/getting_started/installation"
    exit 1
fi

# Cache dependencies and run basic checks
deno cache src/main.ts
echo "✅ Deno dependencies cached"

deno task fmt --check
if [ $? -eq 0 ]; then
    echo "✅ Deno formatting check passed"
else
    echo "⚠️  Deno formatting issues found. Run 'deno task fmt' to fix."
fi

deno task lint
if [ $? -eq 0 ]; then
    echo "✅ Deno linting passed"
else
    echo "❌ Deno linting issues found"
fi

deno task check
if [ $? -eq 0 ]; then
    echo "✅ Deno type checking passed"
else
    echo "❌ Deno type checking failed"
fi

# Test the server
echo "🧪 Testing Deno server..."
deno task test
if [ $? -eq 0 ]; then
    echo "✅ Deno server tests passed"
else
    echo "❌ Deno server tests failed"
fi

# Setup VS Code extension
echo "🔧 Setting up VS Code extension..."
cd ../vscode-extension

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
npm install
if [ $? -eq 0 ]; then
    echo "✅ VS Code extension dependencies installed"
else
    echo "❌ Failed to install VS Code extension dependencies"
    exit 1
fi

# Run build and tests
npm run compile
if [ $? -eq 0 ]; then
    echo "✅ VS Code extension compilation succeeded"
else
    echo "❌ VS Code extension compilation failed"
    exit 1
fi

npm test
if [ $? -eq 0 ]; then
    echo "✅ VS Code extension tests passed"
else
    echo "❌ VS Code extension tests failed"
fi

cd ../..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📚 Next steps for Copilot:"
echo "1. VS Code extension: cd packages/vscode-extension && npm run watch:esbuild"
echo "2. Deno server: cd packages/server && deno task dev"  
echo "3. Run tests: npm test (extension) or deno task test (server)"
echo "4. Format code: npm run format (extension) or deno task fmt (server)"
echo ""
echo "🔗 MCP Server will be available at http://localhost:<dynamic-port>"
echo "🔧 VS Code extension can be loaded in Extension Development Host"
