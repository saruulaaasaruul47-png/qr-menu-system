Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")
New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
npm run dev *> ".logs\backend-dev.combined.log"
