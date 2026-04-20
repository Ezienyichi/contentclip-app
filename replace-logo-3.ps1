$projectRoot = "C:\Users\HP\helpedit"
$total = 0

$pageFile = Join-Path $projectRoot "src\app\page.tsx"
if (Test-Path $pageFile) {
    $content = Get-Content -Path $pageFile -Raw

    $old1 = "<h1 onClick={()=>router.push('/')} style={{ fontSize:24,fontWeight:900,cursor:'pointer' }}>HookClip</h1>"
    $new1 = "<img onClick={()=>router.push('/')} src=`"/hookclip-logo.svg`" alt=`"HookClip`" style={{ height:36,width:'auto',cursor:'pointer' }} />"
    if ($content.Contains($old1)) { $content = $content.Replace($old1, $new1); $total++; Write-Host "  Replaced: auth panel logo" -ForegroundColor Green }

    $old2 = "<span style={{fontSize:'18px',fontWeight:800}}>HookClip</span>"
    $new2 = "<img src=`"/hookclip-logo.svg`" alt=`"HookClip`" style={{height:32,width:'auto'}} />"
    if ($content.Contains($old2)) { $content = $content.Replace($old2, $new2); $total++; Write-Host "  Replaced: navbar logo 1" -ForegroundColor Green }

    $old3 = "<span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>HookClip</span>"
    $new3 = "<img src=`"/hookclip-logo.svg`" alt=`"HookClip`" style={{ height: 32, width: 'auto' }} />"
    if ($content.Contains($old3)) { $content = $content.Replace($old3, $new3); $total++; Write-Host "  Replaced: navbar logo 2" -ForegroundColor Green }

    Set-Content -Path $pageFile -Value $content -NoNewline -Encoding UTF8
    Write-Host "  Saved: page.tsx" -ForegroundColor Cyan
}

$found = Get-ChildItem -Path $projectRoot -Filter "Sidebar.tsx" -Recurse | Where-Object { $_.FullName -notmatch "node_modules|\.next" } | Select-Object -First 1
if ($found) {
    $content = Get-Content -Path $found.FullName -Raw
    $old4 = "<h1 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>HookClip</h1>"
    $new4 = "<img src=`"/hookclip-logo.svg`" alt=`"HookClip`" style={{ height: 28, width: 'auto' }} />"
    if ($content.Contains($old4)) { $content = $content.Replace($old4, $new4); $total++; Write-Host "  Replaced: sidebar logo" -ForegroundColor Green }
    Set-Content -Path $found.FullName -Value $content -NoNewline -Encoding UTF8
    Write-Host "  Saved: Sidebar.tsx" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "  Done! Replacements: $total" -ForegroundColor Cyan
Write-Host "  Run: npm run dev" -ForegroundColor Yellow
