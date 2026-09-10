[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $TgrepArguments
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$executable = Join-Path $projectRoot '.tools\bin\tgrep.exe'
$expectedSha256 = '7809894B8A563436773B46C30BA3C572C26F54C954C9238AC5567249F2D2D5F8'

if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw "tgrep no está instalado en $executable"
}

$actualSha256 = (Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash
if ($actualSha256 -ne $expectedSha256) {
    throw 'La verificación SHA-256 de tgrep falló. No se ejecutará el binario.'
}

$signature = Get-AuthenticodeSignature -LiteralPath $executable
$isMicrosoftSigner = $signature.SignerCertificate.Subject -match '(^|, )O=Microsoft Corporation(,|$)'
if ($signature.Status -ne 'Valid' -or -not $isMicrosoftSigner) {
    throw 'La firma Authenticode de Microsoft para tgrep no es válida.'
}

& $executable @TgrepArguments
exit $LASTEXITCODE
