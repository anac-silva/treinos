param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'status'
)
$ErrorActionPreference = 'Stop'
$dbDirectory = Join-Path $PSScriptRoot '../.local-postgres'
$dbDirectory = (Resolve-Path -LiteralPath $dbDirectory).Path
$pgDirectory = 'C:/Program Files/PostgreSQL/18/bin'
$pgCtl = Join-Path $pgDirectory 'pg_ctl.exe'
$pgReady = Join-Path $pgDirectory 'pg_isready.exe'
$dbPort = 5433
$envFile = Join-Path $PSScriptRoot '../.env'
if (Test-Path -LiteralPath $envFile) {
    $urlLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($urlLine) { $dbPort = ([uri]($urlLine.Substring(13).Trim('"', "'"))).Port }
}
if (!(Test-Path -LiteralPath $pgCtl)) { throw 'PostgreSQL 18 não encontrado em Program Files.' }
if ($Action -eq 'status') {
    & $pgReady -h localhost -p $dbPort
    exit $LASTEXITCODE
}
if ($Action -eq 'start') {
    & $pgReady -h localhost -p $dbPort *> $null
    if ($LASTEXITCODE -eq 0) { Write-Output 'Banco do Treinos já está iniciado.'; exit 0 }
    $dbLog = Join-Path $dbDirectory 'server.log'
    $pgArguments = '-D "' + $dbDirectory + '" -l "' + $dbLog + '" -o "-p ' + $dbPort + '" -w start'
} else {
    $pgArguments = '-D "' + $dbDirectory + '" -m fast -w stop'
}
# Espera somente pg_ctl, sem aguardar o processo permanente do PostgreSQL.
$pgProcess = Start-Process -FilePath $pgCtl -ArgumentList $pgArguments -WindowStyle Hidden -PassThru
$pgProcess.WaitForExit()
exit $pgProcess.ExitCode
