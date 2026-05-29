$ErrorActionPreference = "Stop"

Write-Host "Parando PostgreSQL..."
docker compose down

Write-Host "Se ainda houver terminais do backend/frontend abertos, voce pode fecha-los manualmente."
