$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pairs = @(
    @("docs\UNDERWRITE_TECHNICAL_DOSSIER.pdf", "docs\TECHNICAL.pdf"),
    @("docs\UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf", "docs\SECURITY_SELF_ASSESSMENT.pdf"),
    @("docs\deck\UNDERWRITE_PITCH_DECK.pdf", "docs\deck\deck.pdf")
)

foreach ($pair in $pairs) {
    $source = (Resolve-Path (Join-Path $repo $pair[0])).Path
    $destination = (Resolve-Path (Join-Path $repo $pair[1])).Path
    if (-not $source.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not $destination.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing a path outside the repository."
    }
    Copy-Item -LiteralPath $source -Destination $destination -Force
    $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
    if ($sourceHash -ne $destinationHash) { throw "Hash mismatch after updating $($pair[1])." }
    Write-Host "Updated $($pair[1])"
}

Write-Host "Legacy PDF names now match the canonical competition files."
