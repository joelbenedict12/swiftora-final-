#!/usr/bin/env pwsh

# Navigate to the script's directory
Set-Location $PSScriptRoot

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host "Building Swiftora Backend Server..." -ForegroundColor Cyan

# Build the TypeScript code
npm run build

Write-Host "Starting Swiftora Backend Server..." -ForegroundColor Cyan

# Start the server using compiled JavaScript
node dist/index.js
