<#
.SYNOPSIS
    魚データ（名産地・旬）パイプラインを実行する。
.DESCRIPTION
    1) 名産地: data/raw 内の estat_*.xlsx があれば fetch_estat_fish.py を実行
    2) 旬: fetch_season_calendars.py --input data/raw/season_manual.json
    3) merge_fish_data.py で統合 → data/out/fish_season_origin.json
.PARAMETER SkipFamous
    名産地の集計をスキップ
.PARAMETER CopyToApp
    生成した fish_season_origin.json を src/data/ にコピーする
#>

param(
    [switch]$SkipFamous,
    [switch]$CopyToApp
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$DataRaw = Join-Path $ProjectRoot "data\raw"
$DataOut = Join-Path $ProjectRoot "data\out"

# Python コマンドを検出（python または py）
$PythonCmd = $null
foreach ($cmd in @("python", "py")) {
    $prevErr = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        $out = & $cmd -c "print(1)" 2>&1
        $ErrorActionPreference = $prevErr
        if ($out -eq "1") { $PythonCmd = $cmd; break }
    } catch {
        $ErrorActionPreference = $prevErr
    }
}
if (-not $PythonCmd) {
    Write-Host "Error: Python not found. Use 'python' or 'py'." -ForegroundColor Red
    Write-Host "  e.g. Install Python from Microsoft Store, or try: py --version" -ForegroundColor Yellow
    exit 1
}
Write-Host "Using: $PythonCmd" -ForegroundColor DarkGray

Push-Location $ProjectRoot

if (-not $SkipFamous) {
    $estatFiles = @(Get-ChildItem -Path $DataRaw -Filter "estat_*.xlsx" -ErrorAction SilentlyContinue)
    if ($estatFiles.Count -ge 1) {
        Write-Host "[1/3] Famous origin (e-Stat)..." -ForegroundColor Cyan
        if ($estatFiles.Count -eq 1) {
            & $PythonCmd scripts/fetch_estat_fish.py --excel $estatFiles[0].FullName --year 2023 --top 5 --out "$DataOut/famous_origin.json"
        } else {
            & $PythonCmd scripts/fetch_estat_fish.py --excel-dir $DataRaw --top 5 --out "$DataOut/famous_origin.json"
        }
        if ($LASTEXITCODE -ne 0) { Write-Host "Error in step 1 (exit $LASTEXITCODE)" -ForegroundColor Red; Pop-Location; exit $LASTEXITCODE }
    } else {
        Write-Host "[1/3] No estat_*.xlsx in data/raw. Skipping famous origin." -ForegroundColor Yellow
    }
} else {
    Write-Host "[1/3] Skip famous origin" -ForegroundColor Gray
}

Write-Host "[2/3] Season data..." -ForegroundColor Cyan
$seasonManual = Join-Path $ProjectRoot "data\raw\season_manual.json"
if (Test-Path $seasonManual) {
    & $PythonCmd scripts/fetch_season_calendars.py --sources "data/season_calendar_sources.json" --input $seasonManual --out "$DataOut/season_by_region.json"
} else {
    & $PythonCmd scripts/fetch_season_calendars.py --sources "data/season_calendar_sources.json" --out "$DataOut/season_by_region.json"
}
if ($LASTEXITCODE -ne 0) { Write-Host "Error in step 2 (exit $LASTEXITCODE)" -ForegroundColor Red; Pop-Location; exit $LASTEXITCODE }

Write-Host "[3/3] Merge..." -ForegroundColor Cyan
& $PythonCmd scripts/merge_fish_data.py --famous "$DataOut/famous_origin.json" --season "$DataOut/season_by_region.json" --names "data/fish_name_dict.json" --out "$DataOut/fish_season_origin.json"
if ($LASTEXITCODE -ne 0) { Write-Host "Error in step 3 (exit $LASTEXITCODE)" -ForegroundColor Red; Pop-Location; exit $LASTEXITCODE }

Write-Host "Done: data/out/fish_season_origin.json" -ForegroundColor Green

if ($CopyToApp) {
    $dest = Join-Path $ProjectRoot "src\data\fish_season_origin.json"
    Copy-Item -Path "$DataOut/fish_season_origin.json" -Destination $dest -Force
    Write-Host "Copied to src/data/fish_season_origin.json" -ForegroundColor Green
}

Pop-Location
