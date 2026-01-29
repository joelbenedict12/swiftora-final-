# Swiftora Quick Start Script
Write-Host "🚀 Starting Swiftora Setup..." -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "`n📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = Get-Process -Name postgres -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "❌ PostgreSQL not running. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "Install from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL is running" -ForegroundColor Green

# Install backend dependencies
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location server
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ Backend dependencies already installed" -ForegroundColor Green
}

# Check .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env created. Please edit with your credentials." -ForegroundColor Green
}

# Push database schema
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database setup failed. Check your DATABASE_URL in .env" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema created" -ForegroundColor Green

# Install frontend dependencies
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Edit server/.env with your database credentials" -ForegroundColor White
Write-Host "2. Start backend:  cd server; npm run dev" -ForegroundColor White
Write-Host "3. Start frontend: npm run dev (in root directory)" -ForegroundColor White
Write-Host "`n🌐 URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "DB Admin: cd server; npm run db:studio" -ForegroundColor White
