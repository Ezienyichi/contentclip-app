# HelpEdit Color Migration Script
# Run from C:\Users\HP\helpedit
# Usage: powershell -ExecutionPolicy Bypass -File fix-colors.ps1

$files = Get-ChildItem -Path "app","components" -Recurse -Filter "*.tsx"

$replacements = @(
    # ── Color constant objects (the C = {} definitions) ──
    @{ Old = 'purple: "#7c3aed"';           New = 'purple: "#00ff87"' }
    @{ Old = 'purple:"#7c3aed"';            New = 'purple:"#00ff87"' }
    @{ Old = 'purpleL: "#a78bfa"';          New = 'purpleL: "#60efff"' }
    @{ Old = 'purpleL:"#a78bfa"';           New = 'purpleL:"#60efff"' }
    @{ Old = 'purpleD: "#5b21b6"';          New = 'purpleD: "#00cc6a"' }
    @{ Old = 'purpleD:"#5b21b6"';           New = 'purpleD:"#00cc6a"' }
    @{ Old = 'purpleGlow: "rgba(124,58,237,.12)"';  New = 'purpleGlow: "rgba(0,255,135,.12)"' }
    @{ Old = 'purpleGlow:"rgba(124,58,237,.12)"';   New = 'purpleGlow:"rgba(0,255,135,.12)"' }
    @{ Old = 'purpleBdr: "rgba(124,58,237,.22)"';   New = 'purpleBdr: "rgba(0,255,135,.22)"' }
    @{ Old = 'purpleBdr:"rgba(124,58,237,.22)"';    New = 'purpleBdr:"rgba(0,255,135,.22)"' }

    # ── Hardcoded hex colors ──
    @{ Old = '#7C3AED'; New = '#00ff87' }
    @{ Old = '#7c3aed'; New = '#00ff87' }
    @{ Old = '#A78BFA'; New = '#60efff' }
    @{ Old = '#a78bfa'; New = '#60efff' }
    @{ Old = '#5B21B6'; New = '#00cc6a' }
    @{ Old = '#5b21b6'; New = '#00cc6a' }
    @{ Old = '#c4b5fd'; New = '#60efff' }

    # ── RGBA with various opacities ──
    @{ Old = 'rgba(124,58,237,.28)'; New = 'rgba(0,255,135,.28)' }
    @{ Old = 'rgba(124,58,237,.25)'; New = 'rgba(0,255,135,.25)' }
    @{ Old = 'rgba(124,58,237,.22)'; New = 'rgba(0,255,135,.22)' }
    @{ Old = 'rgba(124,58,237,.2)';  New = 'rgba(0,255,135,.2)' }
    @{ Old = 'rgba(124,58,237,.15)'; New = 'rgba(0,255,135,.15)' }
    @{ Old = 'rgba(124,58,237,.12)'; New = 'rgba(0,255,135,.12)' }
    @{ Old = 'rgba(124,58,237,.1)';  New = 'rgba(0,255,135,.1)' }
    @{ Old = 'rgba(124,58,237,.3)';  New = 'rgba(0,255,135,.3)' }
    @{ Old = 'rgba(124,58,237,.35)'; New = 'rgba(0,255,135,.35)' }
    @{ Old = 'rgba(124,58,237,.4)';  New = 'rgba(0,255,135,.4)' }
    @{ Old = 'rgba(124,58,237,.5)';  New = 'rgba(0,255,135,.5)' }

    # ── Background colors (old dark blue to new dark black) ──
    @{ Old = '#090b14'; New = '#08080c' }
    @{ Old = '#0B0E1A'; New = '#08080c' }
    @{ Old = '#101428'; New = '#0d0d14' }
    @{ Old = '#161B33'; New = '#12121c' }
    @{ Old = '#1E2440'; New = '#1a1a28' }
    @{ Old = '#1A1F35'; New = '#141420' }
    @{ Old = '#1c2035'; New = '#141420' }

    # ── Button text: change white to dark on green buttons ──
    # (This one is tricky — gradient buttons with green bg need dark text)
    # We handle this by replacing the specific btnP pattern
)

# Also fix button text color for gradient buttons
# The pattern: gradient background + color: "#fff" should become color: "#08080c"
$btnFix = @{
    Old = 'color: "#fff", boxShadow: "0 4px 20px rgba(0,255,135,.28)"'
    New = 'color: "#08080c", boxShadow: "0 4px 20px rgba(0,255,135,.28)"'
}

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false

    foreach ($r in $replacements) {
        if ($content.Contains($r.Old)) {
            $count = ([regex]::Matches($content, [regex]::Escape($r.Old))).Count
            $content = $content.Replace($r.Old, $r.New)
            Write-Host "  $($file.Name): '$($r.Old)' -> '$($r.New)' ($count hits)" -ForegroundColor Cyan
            $totalChanges += $count
            $changed = $true
        }
    }

    # Fix button text on gradient backgrounds
    if ($content.Contains($btnFix.Old)) {
        $content = $content.Replace($btnFix.Old, $btnFix.New)
        $changed = $true
        $totalChanges++
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  SAVED: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! $totalChanges replacements across $($files.Count) files." -ForegroundColor Yellow
Write-Host "Run 'npm run dev' to preview the changes." -ForegroundColor Yellow
