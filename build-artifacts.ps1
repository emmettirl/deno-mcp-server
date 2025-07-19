#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Build artifacts for Deno MCP Server monorepo (CI/CD optimized)

.DESCRIPTION
    Creates release artifacts without running tests or linting (assumes CI has already validated).
    Optimized for CI/CD pipelines where validation has already occurred.

.PARAMETER ShowVerbose
    Show detailed output

.EXAMPLE
    .\build-artifacts.ps1
    .\build-artifacts.ps1 -ShowVerbose
#>

param(
    [switch]$ShowVerbose
)

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

function Build-ServerArtifacts {
    Write-Host "🏗️ Building server artifacts..." -ForegroundColor Yellow
    
    # Cache server dependencies (no explicit build needed for Deno)
    Invoke-BuildCommand "Server dependency cache" "deno" @("cache", "--reload", "mod.ts") $ServerDir
    
    Write-Success "Server artifacts ready"
}

function Build-ExtensionArtifacts {
    Write-Host "📦 Building VS Code extension..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$ExtDir\package.json")) {
        Write-Host "⚠️ Extension package.json not found, skipping extension build" -ForegroundColor Yellow
        return
    }
    
    # Install dependencies
    Invoke-BuildCommand "Install dependencies" "npm" @("ci") $ExtDir
    
    # Compile extension
    Invoke-BuildCommand "Compile extension" "npm" @("run", "compile") $ExtDir
    
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
    
    Write-Success "Extension artifacts created"
}

function Show-ArtifactSummary {
    Write-Host "📋 Artifact Summary:" -ForegroundColor Green
    
    if (Test-Path "$ServerDir\mod.ts") {
        Write-Host "  🦕 Server: Ready (Deno module at $ServerDir\mod.ts)" -ForegroundColor Green
    }
    
    $vsixFiles = Get-ChildItem "$ExtDir\*.vsix" -ErrorAction SilentlyContinue
    if ($vsixFiles) {
        foreach ($file in $vsixFiles) {
            Write-Host "  📦 Extension: $($file.Name)" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️ Extension: No .vsix files found" -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "🚀 Building artifacts for Deno MCP Server monorepo..." -ForegroundColor Green

try {
    Build-ServerArtifacts
    Build-ExtensionArtifacts
    Show-ArtifactSummary
    
    Write-Success "All artifacts built successfully!"
}
catch {
    Write-BuildError "Artifact build failed: $($_.Exception.Message)"
    exit 1
}
