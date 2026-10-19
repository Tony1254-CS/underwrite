param(
    [switch]$CaptureLightScreens,
    [string]$WebBaseUrl = "http://127.0.0.1:3001"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chrome) { throw "Google Chrome is required to render the competition PDFs." }

if ($CaptureLightScreens) {
    & python (Join-Path $repo "docs\professional\capture_light.py") $WebBaseUrl
    if ($LASTEXITCODE -ne 0) { throw "Light-mode screenshot capture failed." }
}

$screens = Join-Path $repo "docs\professional\assets\screens-light"
$requiredScreens = @("home.png", "dashboard.png", "exam.png", "attack.png", "evidence.png", "experiment.png")
foreach ($name in $requiredScreens) {
    if (-not (Test-Path -LiteralPath (Join-Path $screens $name))) {
        throw "Missing required light-mode capture: $name"
    }
}

$pdfJobs = @(
    @{ Source = "docs\professional\technical.html"; Output = "docs\UNDERWRITE_TECHNICAL_DOSSIER.pdf" },
    @{ Source = "docs\professional\security.html"; Output = "docs\UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf" },
    @{ Source = "docs\professional\onchain-evidence.html"; Output = "docs\ONCHAIN_EVIDENCE.pdf" }
)

foreach ($job in $pdfJobs) {
    $source = (Resolve-Path (Join-Path $repo $job.Source)).Path
    $output = Join-Path $repo $job.Output
    $uri = [System.Uri]::new($source).AbsoluteUri
    & $chrome --headless --disable-gpu --no-pdf-header-footer "--print-to-pdf=$output" $uri | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) {
        throw "PDF render failed: $($job.Output)"
    }
}

& python (Join-Path $repo "docs\deck\build_deck.py")
if ($LASTEXITCODE -ne 0) { throw "PowerPoint source generation failed." }

$pptx = (Resolve-Path (Join-Path $repo "docs\deck\UNDERWRITE_PITCH_DECK.pptx")).Path
$deckPdf = Join-Path $repo "docs\deck\UNDERWRITE_PITCH_DECK.pdf"
$powerpoint = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $powerpoint.Presentations.Open($pptx, $true, $false, $false)
    try { $presentation.SaveAs($deckPdf, 32) } finally { $presentation.Close() }
} finally {
    $powerpoint.Quit()
    if ($presentation) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) }
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerpoint)
}

$artifacts = @(
    "docs\UNDERWRITE_TECHNICAL_DOSSIER.pdf",
    "docs\UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf",
    "docs\ONCHAIN_EVIDENCE.pdf",
    "docs\deck\UNDERWRITE_PITCH_DECK.pdf",
    "docs\deck\UNDERWRITE_PITCH_DECK.pptx"
)
$manifestEntries = foreach ($relative in $artifacts) {
    $file = Get-Item -LiteralPath (Join-Path $repo $relative)
    [ordered]@{
        path = $relative.Replace("\", "/")
        bytes = $file.Length
        sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}
$manifest = [ordered]@{
    schemaVersion = "1.0"
    generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    screenshotPolicy = "All embedded product screenshots are light mode. Scripted, simulated and controlled views must be labeled."
    artifacts = @($manifestEntries)
}
$manifestPath = Join-Path $repo "docs\competition\ARTIFACT_MANIFEST.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8

Write-Host "Competition package built successfully."
$manifestEntries | ForEach-Object { [pscustomobject]$_ } | Format-Table path, bytes, sha256 -AutoSize
