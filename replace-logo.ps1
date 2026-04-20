# ═══════════════════════════════════════════════════════════════
# HookClip Logo Replacement Script
# Replaces all text-based "HookClip" logos with the SVG image
# Run from C:\Users\HP\helpedit in PowerShell
# ═══════════════════════════════════════════════════════════════

$projectRoot = "C:\Users\HP\helpedit"
$extensions = @("*.tsx", "*.ts", "*.jsx", "*.js")
$excludeDirs = @("node_modules", ".next", ".git", ".vercel")
$totalReplacements = 0
$filesChanged = 0

# Patterns to find and replace (covers common logo patterns in your codebase)
$patterns = @(
    # Pattern 1: Gradient text logo in a div (navbar/header style)
    @{
        Find = '<span style=\{\{ background: [^}]*grad[^}]*WebkitBackgroundClip[^}]*WebkitTextFillColor[^}]*\}\}>[\s]*HookClip[\s]*</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    # Pattern 2: Simple gradient span with C.grad
    @{
        Find = '<span style=\{\{ background: C\.grad, WebkitBackgroundClip: .text., WebkitTextFillColor: .transparent. \}\}>HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    }
)

# Simpler string replacements (these catch most cases)
$stringReplacements = @(
    # Navbar/header logos with gradient
    @{
        Find = '<span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    @{
        Find = "<span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HookClip</span>"
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    # Linear gradient versions
    @{
        Find = '<span style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    @{
        Find = "<span style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HookClip</span>"
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    # Gradient text class version
    @{
        Find = '<span className="gradient-text">HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 36, width: "auto" }} />'
    },
    # Footer versions (smaller)
    @{
        Find = '<span style={{ fontWeight: 700 }}>HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 28, width: "auto", opacity: 0.7 }} />'
    },
    @{
        Find = '<span style={{ fontWeight: 800 }}>HookClip</span>'
        Replace = '<img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 28, width: "auto", opacity: 0.7 }} />'
    }
)

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $projectRoot -Filter $ext -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $path = $_.FullName
            $skip = $false
            foreach ($dir in $excludeDirs) {
                if ($path -match "\\$dir\\") { $skip = $true; break }
            }
            -not $skip
        }

    foreach ($file in $files) {
        try {
            $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
            if ($null -eq $content) { continue }

            $originalContent = $content
            $fileReplacements = 0

            # Apply string replacements
            foreach ($r in $stringReplacements) {
                if ($content.Contains($r.Find)) {
                    $count = ([regex]::Matches($content, [regex]::Escape($r.Find))).Count
                    $content = $content.Replace($r.Find, $r.Replace)
                    $fileReplacements += $count
                    Write-Host "    Matched pattern in $($file.Name)" -ForegroundColor DarkGray
                }
            }

            if ($fileReplacements -gt 0) {
                Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
                $filesChanged++
                $totalReplacements += $fileReplacements
                Write-Host "  Updated: $($file.FullName) ($fileReplacements logo replacements)" -ForegroundColor Green
            }
        } catch {
            Write-Host "  Skipped: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Logo Replacement Complete!" -ForegroundColor Cyan
Write-Host "  Files changed: $filesChanged" -ForegroundColor Cyan
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

if ($totalReplacements -eq 0) {
    Write-Host ""
    Write-Host "  No automatic matches found." -ForegroundColor Yellow
    Write-Host "  Your logo text might use a different pattern." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Searching for 'HookClip' in styled spans..." -ForegroundColor Yellow
    
    foreach ($ext in $extensions) {
        $files = Get-ChildItem -Path $projectRoot -Filter $ext -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object {
                $path = $_.FullName
                $skip = $false
                foreach ($dir in $excludeDirs) {
                    if ($path -match "\\$dir\\") { $skip = $true; break }
                }
                -not $skip
            }
        foreach ($file in $files) {
            $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -and $content -match "HookClip") {
                $lineNum = 1
                foreach ($line in (Get-Content $file.FullName)) {
                    if ($line -match "HookClip" -and $line -match "style|className|gradient") {
                        Write-Host "  $($file.FullName):$lineNum" -ForegroundColor Magenta
                        Write-Host "    $($line.Trim())" -ForegroundColor DarkGray
                    }
                    $lineNum++
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "  Copy the exact line shown above and share it with Claude" -ForegroundColor Yellow
    Write-Host "  so I can give you the precise replacement." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm run dev" -ForegroundColor Yellow
Write-Host "  2. Check localhost:3000" -ForegroundColor Yellow
Write-Host "  3. git add . && git commit -m 'feat: add HookClip logo' && git push" -ForegroundColor Yellow
