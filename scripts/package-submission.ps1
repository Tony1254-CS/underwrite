param(
    [string]$RegistrationFormPath = "$env:USERPROFILE\Downloads\Appendix 3-Registration Form (International Track, English Only).xlsx"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$submission = Join-Path $repo "submission"
$private = Join-Path $submission "private"

if (-not (Test-Path -LiteralPath $submission)) { New-Item -ItemType Directory -Path $submission | Out-Null }
if (-not (Test-Path -LiteralPath $private)) { New-Item -ItemType Directory -Path $private | Out-Null }

& python (Join-Path $repo "scripts\qa_submission.py")
if ($LASTEXITCODE -ne 0) { throw "Canonical submission QA failed; package was not refreshed." }

$copies = @(
    @("docs\deck\UNDERWRITE_PITCH_DECK.pdf", "02_UNDERWRITE_Pitch_Deck.pdf"),
    @("docs\UNDERWRITE_TECHNICAL_DOSSIER.pdf", "03_UNDERWRITE_Technical_Dossier.pdf"),
    @("docs\UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf", "04_UNDERWRITE_Security_Self_Assessment.pdf"),
    @("docs\ONCHAIN_EVIDENCE.pdf", "05_UNDERWRITE_Onchain_Evidence.pdf"),
    @("docs\competition\ARTIFACT_MANIFEST.json", "06_Artifact_Manifest.json")
)

foreach ($pair in $copies) {
    $source = (Resolve-Path (Join-Path $repo $pair[0])).Path
    $destination = Join-Path $submission $pair[1]
    if (-not $source.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not $destination.StartsWith($submission, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing a path outside the submission package."
    }
    Copy-Item -LiteralPath $source -Destination $destination -Force
}

if (Test-Path -LiteralPath $RegistrationFormPath) {
    Copy-Item -LiteralPath $RegistrationFormPath -Destination (Join-Path $private "01_Registration_Form_COMPLETE_BEFORE_SENDING.xlsx") -Force
    Write-Host "Copied the official registration workbook into the gitignored private folder."
} else {
    Write-Warning "Official registration workbook was not found at: $RegistrationFormPath"
}

$publicFiles = Get-ChildItem -LiteralPath $submission -File |
    Where-Object { $_.Name -ne "PACKAGE_SHA256.txt" } |
    Sort-Object Name
$hashLines = foreach ($file in $publicFiles) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $($file.Name)"
}
$hashPath = Join-Path $submission "PACKAGE_SHA256.txt"
$hashLines | Set-Content -LiteralPath $hashPath -Encoding ascii

Write-Host "Submission folder refreshed: $submission"
Get-ChildItem -LiteralPath $submission -File | Sort-Object Name | Select-Object Name, Length | Format-Table -AutoSize
