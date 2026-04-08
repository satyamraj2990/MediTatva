$mongosh = "C:\Users\satya\AppData\Local\Programs\mongosh\mongosh.exe"

if (-not (Test-Path $mongosh)) {
  Write-Error "mongosh not found at: $mongosh"
  exit 1
}

& $mongosh "mongodb://127.0.0.1:27017/meditatva"
