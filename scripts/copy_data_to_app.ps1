<#
.SYNOPSIS
    Copy filtered sushi data to the React Native app.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

$SourceFile = Join-Path $ProjectRoot "data\out\sushi_tokyo_filtered.geojson"
$DestFile = Join-Path $ProjectRoot "src\data\tokyo_sushi.json"

if (-not (Test-Path $SourceFile)) {
    Write-Host "Source file not found: $SourceFile" -ForegroundColor Red
    Write-Host "Run 'python scripts\filter_tokyo.py' first." -ForegroundColor Yellow
    exit 1
}

Copy-Item -Path $SourceFile -Destination $DestFile -Force
Write-Host "Copied sushi data to app!" -ForegroundColor Green
Write-Host "  From: $SourceFile"
Write-Host "  To:   $DestFile"

# Optional: copy fish season/origin data if present
$FishDataOut = Join-Path $ProjectRoot "data\out\fish_season_origin.json"
$FishDataDest = Join-Path $ProjectRoot "src\data\fish_season_origin.json"
if (Test-Path $FishDataOut) {
    Copy-Item -Path $FishDataOut -Destination $FishDataDest -Force
    Write-Host "Copied fish season/origin data to app." -ForegroundColor Green
}

$content = Get-Content $DestFile -Raw | ConvertFrom-Json
Write-Host "  Features: $($content.features.Count)" -ForegroundColor Cyan
