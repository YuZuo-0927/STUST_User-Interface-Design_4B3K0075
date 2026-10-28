# Generate ArtScope placeholder artwork (SVG) - ASCII only script
# Usage: powershell -ExecutionPolicy Bypass -File tools\make-placeholders.ps1
# These images are PLACEHOLDERS for layout testing only.

$dir = Join-Path $PSScriptRoot "..\assets\placeholders"
$dir = [System.IO.Path]::GetFullPath($dir)
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function New-Placeholder {
    param(
        [string]$Name,
        [string]$Line1,
        [string]$Line2,
        [int]$W = 1200,
        [int]$H = 900,
        [int]$Hue = 24
    )

    $grid = ""
    for ($x = 0; $x -le $W; $x += 60) { $grid += "<line x1='$x' y1='0' x2='$x' y2='$H'/>" }
    for ($y = 0; $y -le $H; $y += 60) { $grid += "<line x1='0' y1='$y' x2='$W' y2='$y'/>" }

    $cx = [int]($W / 2)
    $cy = [int]($H / 2) - 20
    $r  = [int]([Math]::Min($W, $H) * 0.26)
    $r2 = [int]($r * 0.6)

    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="$W" height="$H" viewBox="0 0 $W $H">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl($Hue,42%,20%)"/>
      <stop offset="1" stop-color="hsl($Hue,35%,9%)"/>
    </linearGradient>
  </defs>
  <rect width="$W" height="$H" fill="url(#bg)"/>
  <g stroke="hsl($Hue,60%,80%)" stroke-opacity="0.10" stroke-width="1">$grid</g>
  <circle cx="$cx" cy="$cy" r="$r" fill="none" stroke="hsl($Hue,65%,75%)" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="$cx" cy="$cy" r="$r2" fill="hsl($Hue,50%,60%)" fill-opacity="0.14"/>
  <text x="$cx" y="$($cy + 8)" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="hsl($Hue,45%,90%)">$Line1</text>
  <text x="$cx" y="$($cy + 54)" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="hsl($Hue,35%,80%)" fill-opacity="0.9">$Line2</text>
  <text x="32" y="$($H - 32)" font-family="system-ui, sans-serif" font-size="20" fill="hsl($Hue,30%,82%)" fill-opacity="0.75">PLACEHOLDER - PLACEHOLDER ART - NOT A REAL ARTWORK</text>
</svg>
"@
    $path = Join-Path $dir "$Name.svg"
    [System.IO.File]::WriteAllText($path, $svg, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ("created: " + $Name + ".svg")
}

# hero + favicon
New-Placeholder -Name "hero" -Line1 "ArtScope" -Line2 "Hero placeholder" -W 1600 -H 1000 -Hue 22
New-Placeholder -Name "favicon" -Line1 "AS" -Line2 "" -W 64 -H 64 -Hue 22

# six DEMO covers
New-Placeholder -Name "work-001-cover" -Line1 "DEMO 01" -Line2 "Cover placeholder" -Hue 18
New-Placeholder -Name "work-002-cover" -Line1 "DEMO 02" -Line2 "Cover placeholder" -Hue 200
New-Placeholder -Name "work-003-cover" -Line1 "DEMO 03" -Line2 "Cover placeholder" -Hue 140
New-Placeholder -Name "work-004-cover" -Line1 "DEMO 04" -Line2 "Cover placeholder" -Hue 330
New-Placeholder -Name "work-005-cover" -Line1 "DEMO 05" -Line2 "Cover placeholder" -Hue 45
New-Placeholder -Name "work-006-cover" -Line1 "DEMO 06" -Line2 "Cover placeholder" -Hue 265

# detail images
New-Placeholder -Name "detail-a" -Line1 "DETAIL A" -Line2 "Detail placeholder" -W 1400 -H 1050 -Hue 30
New-Placeholder -Name "detail-b" -Line1 "DETAIL B" -Line2 "Detail placeholder" -W 1400 -H 1050 -Hue 210
New-Placeholder -Name "detail-c" -Line1 "DETAIL C" -Line2 "Detail placeholder" -W 1400 -H 1050 -Hue 160

# process stage images
New-Placeholder -Name "process-1" -Line1 "STAGE 1" -Line2 "Process placeholder" -W 1200 -H 800 -Hue 200
New-Placeholder -Name "process-2" -Line1 "STAGE 2" -Line2 "Process placeholder" -W 1200 -H 800 -Hue 200
New-Placeholder -Name "process-3" -Line1 "STAGE 3" -Line2 "Process placeholder" -W 1200 -H 800 -Hue 200
New-Placeholder -Name "process-4" -Line1 "STAGE 4" -Line2 "Process placeholder" -W 1200 -H 800 -Hue 200

$count = (Get-ChildItem -Path $dir -Filter *.svg | Measure-Object).Count
Write-Host ("total svg files: " + $count)
