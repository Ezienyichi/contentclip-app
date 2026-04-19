# ═══════════════════════════════════════════════════════════════
# HookClip Rebrand Script — Run in PowerShell from C:\Users\HP\helpedit
# Replaces all instances of ContentClip/contentclip with HookClip/hookclip
# Skips node_modules, .next, .git, and binary files
# ═══════════════════════════════════════════════════════════════

$projectRoot = "C:\Users\HP\helpedit"

# File extensions to process
$extensions = @("*.tsx", "*.ts", "*.js", "*.jsx", "*.json", "*.css", "*.html", "*.md", "*.env*", "*.txt", "*.sql", "*.yml", "*.yaml", "*.toml", "*.cfg")

# Folders to skip
$excludeDirs = @("node_modules", ".next", ".git", ".vercel", "dist", "build", ".turbo")

# Replacements (order matters — do uppercase/mixed case first)
$replacements = @(
    @{ Find = "CONTENTCLIP";  Replace = "HOOKCLIP" },
    @{ Find = "ContentClips"; Replace = "HookClip" },
    @{ Find = "ContentClip";  Replace = "HookClip" },
    @{ Find = "Contentclip";  Replace = "Hookclip" },
    @{ Find = "contentclips"; Replace = "hookclip" },
    @{ Find = "contentclip";  Replace = "hookclip" },
    @{ Find = "Content Clip"; Replace = "HookClip" },
    @{ Find = "content-clip"; Replace = "hookclip" },
    @{ Find = "content_clip"; Replace = "hook_clip" }
)

$totalReplacements = 0
$filesChanged = 0

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

            foreach ($r in $replacements) {
                $count = ([regex]::Matches($content, [regex]::Escape($r.Find))).Count
                if ($count -gt 0) {
                    $content = $content -replace [regex]::Escape($r.Find), $r.Replace
                    $fileReplacements += $count
                }
            }

            if ($fileReplacements -gt 0) {
                Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
                $filesChanged++
                $totalReplacements += $fileReplacements
                Write-Host "  Updated: $($file.FullName) ($fileReplacements replacements)" -ForegroundColor Green
            }
        } catch {
            Write-Host "  Skipped: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Rebrand Complete!" -ForegroundColor Cyan
Write-Host "  Files changed: $filesChanged" -ForegroundColor Cyan
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor Yellow
Write-Host "  2. Check localhost:3000 looks good" -ForegroundColor Yellow
Write-Host "  3. Run: git add . && git commit -m 'rebrand: ContentClip -> HookClip' && git push" -ForegroundColor Yellow
