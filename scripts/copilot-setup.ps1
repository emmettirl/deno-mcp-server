# Copilot Development Setup Script for Windows
# This script demonstrates the typical development workflow for the Deno MCP Server project

Write-Host "🚀 Setting up Deno MCP Server development environment for Copilot..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "deno.json") -or -not (Test-Path "packages")) {
    Write-Host "❌ Error: Please run this script from the root of the deno-mcp-server repository" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Project structure validated" -ForegroundColor Green

# Setup Deno server
Write-Host "🦕 Setting up Deno server..." -ForegroundColor Blue
Set-Location packages/server

# Check if Deno is installed
if (-not (Get-Command deno -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Deno is not installed. Please install Deno first: https://deno.land/manual/getting_started/installation" -ForegroundColor Red
    exit 1
}

# Cache dependencies and run basic checks
deno cache src/main.ts
Write-Host "✅ Deno dependencies cached" -ForegroundColor Green

deno task fmt --check
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deno formatting check passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Deno formatting issues found. Run 'deno task fmt' to fix." -ForegroundColor Yellow
}

deno task lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deno linting passed" -ForegroundColor Green
} else {
    Write-Host "❌ Deno linting issues found" -ForegroundColor Red
}

deno task check
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deno type checking passed" -ForegroundColor Green
} else {
    Write-Host "❌ Deno type checking failed" -ForegroundColor Red
}

# Test the server
Write-Host "🧪 Testing Deno server..." -ForegroundColor Blue
deno task test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deno server tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Deno server tests failed" -ForegroundColor Red
}

# Setup VS Code extension
Write-Host "🔧 Setting up VS Code extension..." -ForegroundColor Blue
Set-Location ../vscode-extension

# Check if Node.js is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install dependencies
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VS Code extension dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install VS Code extension dependencies" -ForegroundColor Red
    exit 1
}

# Run build and tests
npm run compile
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VS Code extension compilation succeeded" -ForegroundColor Green
} else {
    Write-Host "❌ VS Code extension compilation failed" -ForegroundColor Red
    exit 1
}

npm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VS Code extension tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ VS Code extension tests failed" -ForegroundColor Red
}

Set-Location ../..

Write-Host ""
Write-Host "🎉 Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps for Copilot:" -ForegroundColor Cyan
Write-Host "1. VS Code extension: cd packages/vscode-extension && npm run watch:esbuild" -ForegroundColor White
Write-Host "2. Deno server: cd packages/server && deno task dev" -ForegroundColor White
Write-Host "3. Run tests: npm test (extension) or deno task test (server)" -ForegroundColor White
Write-Host "4. Format code: npm run format (extension) or deno task fmt (server)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 MCP Server will be available at http://localhost:<dynamic-port>" -ForegroundColor Yellow
Write-Host "🔧 VS Code extension can be loaded in Extension Development Host" -ForegroundColor Yellow
