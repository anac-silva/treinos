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
if (!(Test-Path -LiteralPath $pgCtl)) { throw 'PostgreSQL 18 não encontrado em Program Files.' }
if ($Action -eq 'status') {
    & $pgReady -h localhost -p 5433
    exit $LASTEXITCODE
}
if ($Action -eq 'start') {
    & $pgReady -h localhost -p 5433 *> $null
    if ($LASTEXITCODE -eq 0) { Write-Output 'Banco do Treinos já está iniciado.'; exit 0 }
    $dbLog = Join-Path $dbDirectory 'server.log'
    $pgArguments = '-D "' + $dbDirectory + '" -l "' + $dbLog + '" -w start'
} else {
    $pgArguments = '-D "' + $dbDirectory + '" -m fast -w stop'
}
# Espera somente pg_ctl, sem aguardar o processo permanente do PostgreSQL.
$pgProcess = Start-Process -FilePath $pgCtl -ArgumentList $pgArguments -WindowStyle Hidden -PassThru
$pgProcess.WaitForExit()
exit $pgProcess.ExitCode
