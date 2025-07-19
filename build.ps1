#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Build script for Deno MCP Server monorepo

.DESCRIPTION
    Runs formatting, linting, type checking, tests, building, and packaging
    for both server and VS Code extension packages.

.PARAMETER Command
    The command to run: fmt, lint, check, test, build, package, all, clean

.PARAMETER ServerOnly
    Only run commands for the server package

.PARAMETER ExtOnly
    Only run commands for the extension package

.PARAMETER ShowVerbose
    Show detailed output

.EXAMPLE
    .\build.ps1 all
    .\build.ps1 test -ShowVerbose
    .\build.ps1 fmt -ServerOnly
    .\build.ps1 package -ExtOnly
#>

param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("fmt", "lint", "check", "test", "build", "package", "all", "clean", "help")]
    [string]$Command,
    
    [switch]$ServerOnly,
    [switch]$ExtOnly,
    [switch]$ShowVerbose
)

# Validate conflicting options
if ($ServerOnly -and $ExtOnly) {
    Write-BuildError "Cannot use -ServerOnly and -ExtOnly together"
    exit 1
}

$ServerDir = "packages\server"
$ExtDir = "packages\vscode-extension"

function Write-Step {
    param([string]$Message)
    Write-Host "  $Message..." -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-BuildError {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Invoke-BuildCommand {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments,
        [string]$WorkingDirectory = $PWD
    )
    
    if ($ShowVerbose) {
        Write-Host "  Running: $Command $($Arguments -join ' ') (in $WorkingDirectory)" -ForegroundColor Gray
    } else {
        Write-Step $Name
    }
    
    $originalLocation = Get-Location
    try {
        Set-Location $WorkingDirectory
        
        if ($ShowVerbose) {
            & $Command @Arguments
        } else {
            & $Command @Arguments 2>&1 | Out-Null
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-BuildError "$Name failed with exit code $LASTEXITCODE"
            exit $LASTEXITCODE
        }
        
        if ($ShowVerbose) {
            Write-Host "  ✅ $Name completed" -ForegroundColor Green
        }
    }
    finally {
        Set-Location $originalLocation
    }
}

function Format-Code {
    Write-Host "📝 Formatting code..." -ForegroundColor Yellow
    
    if (-not $ExtOnly) {
        # Format all Deno/TypeScript files from root (includes server package and root files)
        Invoke-BuildCommand "Deno format (all)" "deno" @("fmt") "."
    }
    
    if (-not $ServerOnly) {
        if (Test-Path "$ExtDir\package.json") {
            Invoke-BuildCommand "Extension format" "npm" @("run", "format") $ExtDir
        }
    }
}

function Lint-Code {
    Write-Host "🔍 Linting code..." -ForegroundColor Yellow
    
    if (-not $ExtOnly) {
        Invoke-BuildCommand "Server lint" "deno" @("lint") $ServerDir
    }
    
    if (-not $ServerOnly) {
        if (Test-Path "$ExtDir\package.json") {
            Invoke-BuildCommand "Extension lint" "npm" @("run", "lint") $ExtDir
        }
    }
}

function Check-Types {
    Write-Host "🔎 Type checking..." -ForegroundColor Yellow
    
    if (-not $ExtOnly) {
        Invoke-BuildCommand "Server check main" "deno" @("check", "src\main.ts") $ServerDir
        Invoke-BuildCommand "Server check mod" "deno" @("check", "mod.ts") $ServerDir
    }
    
    if (-not $ServerOnly) {
        if (Test-Path "$ExtDir\package.json") {
            Invoke-BuildCommand "Extension check" "npm" @("run", "check-types") $ExtDir
        }
    }
}

function Run-Tests {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    
    if (-not $ExtOnly) {
        Invoke-BuildCommand "Server tests" "deno" @("test", "--allow-all") $ServerDir
    }
    
    if (-not $ServerOnly) {
        if (Test-Path "$ExtDir\package.json") {
            Invoke-BuildCommand "Extension tests" "npm" @("test") $ExtDir
        }
    }
}

function Build-Packages {
    Write-Host "🏗️ Building packages..." -ForegroundColor Yellow
    
    if (-not $ExtOnly) {
        # Server doesn't need explicit build, but we can cache dependencies
        Invoke-BuildCommand "Server cache" "deno" @("cache", "--reload", "mod.ts") $ServerDir
    }
    
    if (-not $ServerOnly) {
        if (Test-Path "$ExtDir\package.json") {
            Invoke-BuildCommand "Extension build" "npm" @("run", "compile") $ExtDir
        }
    }
}

function Package-Extension {
    Write-Host "📦 Packaging extension..." -ForegroundColor Yellow
    
    if ($ServerOnly) {
        Write-Host "⚠️ Skipping package (server-only mode)" -ForegroundColor Yellow
        return
    }
    
    if (-not (Test-Path "$ExtDir\package.json")) {
        Write-Host "⚠️ Extension package.json not found, skipping package" -ForegroundColor Yellow
        return
    }
    
    # Ensure extension is built first
    Invoke-BuildCommand "Extension compile" "npm" @("run", "compile") $ExtDir
    
    # Check if vsce is available
    try {
        Invoke-BuildCommand "Check vsce" "npx" @("vsce", "--version") $ExtDir
    }
    catch {
        Write-Step "Installing vsce"
        Invoke-BuildCommand "Install vsce" "npm" @("install", "-g", "@vscode/vsce") $ExtDir
    }
    
    # Package extension
    Invoke-BuildCommand "Package extension" "npx" @("vsce", "package") $ExtDir
}

function Clean-Artifacts {
    Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow
    
    $pathsToClean = @(
        "packages\vscode-extension\out",
        "packages\vscode-extension\node_modules", 
        "packages\vscode-extension\.vscode-test",
        "packages\vscode-extension\*.vsix",
        "packages\server\.deno",
        "deno-mcp-extension"  # Legacy directory cleanup
    )
    
    foreach ($path in $pathsToClean) {
        if (Test-Path $path) {
            Write-Step "Removing $path"
            Remove-Item $path -Recurse -Force
        }
    }
}

function Show-Help {
    Write-Host @"
🛠️ Deno MCP Server Build Script

Usage:
  .\build.ps1 [command] [options]

Commands:
  fmt      - Format all code
  lint     - Lint all code  
  check    - Type check all code
  test     - Run all tests
  build    - Build all packages
  package  - Package extension
  all      - Run all commands (fmt, lint, check, test, build, package)
  clean    - Clean build artifacts
  help     - Show this help

Options:
  -ServerOnly    - Only run for server package
  -ExtOnly       - Only run for extension package  
  -ShowVerbose   - Show detailed output

Examples:
  .\build.ps1 all
  .\build.ps1 test -ShowVerbose
  .\build.ps1 fmt -ServerOnly
  .\build.ps1 package -ExtOnly
"@ -ForegroundColor Cyan
}

# Main execution
Write-Host "🚀 Starting $Command for Deno MCP Server monorepo..." -ForegroundColor Green

try {
    switch ($Command) {
        "fmt" { Format-Code }
        "lint" { Lint-Code }
        "check" { Check-Types }
        "test" { Run-Tests }
        "build" { Build-Packages }
        "package" { Package-Extension }
        "all" { 
            Format-Code
            Lint-Code
            Check-Types
            Run-Tests
            Build-Packages
            if (-not $ServerOnly) { Package-Extension }
        }
        "clean" { Clean-Artifacts }
        "help" { Show-Help; exit 0 }
    }
    
    Write-Success "$Command completed successfully!"
}
catch {
    Write-BuildError "Build failed: $($_.Exception.Message)"
    exit 1
}
