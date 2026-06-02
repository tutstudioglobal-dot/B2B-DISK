# SAPKEY Supabase Auto Setup
param(
  [string]$SqlFile = "C:\sapkey-next\supabase_setup.sql",
  [string]$ProjectRef = "ehdxisutvrqqfiozarxq"
)

Write-Host "=== SAPKEY Supabase Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if supabase CLI exists
$supabase = Get-Command "supabase" -ErrorAction SilentlyContinue
if (-not $supabase) {
  Write-Host "Supabase CLI is required. Install with:" -ForegroundColor Yellow
  Write-Host "  npm install -g supabase" -ForegroundColor White
  exit 1
}

Write-Host "Supabase CLI found: $(supabase --version)" -ForegroundColor Green

# 2. Check if SQL file exists
if (-not (Test-Path $SqlFile)) {
  Write-Host "SQL file not found: $SqlFile" -ForegroundColor Red
  exit 1
}

# 3. Get database password
$password = Read-Host "Enter your Supabase database password (from Project Settings → Database → Connection string)"
if (-not $password) {
  Write-Host "Password is required" -ForegroundColor Red
  exit 1
}

# 4. Construct connection string
$dbUrl = "postgresql://postgres:$password@db.$ProjectRef.supabase.co:6543/postgres?sslmode=require"

Write-Host "Connecting to Supabase database..." -ForegroundColor Cyan

# 5. Test connection with a simple query
$testResult = supabase db query --db-url $dbUrl --output json "SELECT 1 AS test" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Connection failed. Check your password and try again." -ForegroundColor Red
  Write-Host "Error: $testResult" -ForegroundColor Red
  exit 1
}

Write-Host "Connection successful!" -ForegroundColor Green

# 6. Read and execute SQL file
Write-Host "Creating tables and functions..." -ForegroundColor Cyan
$sqlContent = Get-Content $SqlFile -Raw
$result = supabase db query --db-url $dbUrl "$sqlContent" 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tables created successfully!" -ForegroundColor Green
} else {
  Write-Host "Error creating tables:" -ForegroundColor Red
  Write-Host $result -ForegroundColor Red
  exit 1
}

# 7. Generate 1M products
Write-Host "" -ForegroundColor Cyan
Write-Host "=== Ready to Generate Products ===" -ForegroundColor Cyan
Write-Host "Run the following in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "  SELECT generate_infinite_petroleum_system(500, 2000);" -ForegroundColor White
Write-Host ""
Write-Host "Or from CLI:" -ForegroundColor Yellow
$answer = Read-Host "Generate 1M products now? (y/n)"
if ($answer -eq 'y') {
  Write-Host "Generating 1M products (this may take 3-8 minutes)..." -ForegroundColor Cyan
  $genResult = supabase db query --db-url $dbUrl --output json "SELECT generate_infinite_petroleum_system(500, 2000);" 2>&1
  Write-Host $genResult -ForegroundColor Green
}

Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Now restart the app at http://localhost:8082" -ForegroundColor Yellow
Write-Host "Go to Settings → Cloud Sync → Connect & Test" -ForegroundColor Yellow
