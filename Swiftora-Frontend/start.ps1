# Start both backend and frontend in separate terminals

Write-Host "🚀 Starting Swiftora Platform..." -ForegroundColor Cyan

# Start backend in new window
Write-Host "`n🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "🎨 Starting frontend server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n✨ Both servers starting in separate windows!" -ForegroundColor Green
Write-Host "`n🌐 URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "`nPress Ctrl+C in each window to stop servers" -ForegroundColor Yellow
