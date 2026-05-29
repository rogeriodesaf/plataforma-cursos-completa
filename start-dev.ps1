$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "plataforma-cursos"
$frontendPath = Join-Path $root "frontend-angular"

Write-Host "Subindo PostgreSQL com Docker Compose..."
docker compose up -d

Write-Host "Abrindo backend Quarkus..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendPath'; mvn quarkus:dev"
)

Write-Host "Abrindo frontend Angular..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; cmd /c npm.cmd start"
)

Write-Host "Ambiente iniciado."
Write-Host "Backend: http://localhost:8180"
Write-Host "Frontend: http://localhost:4200"
