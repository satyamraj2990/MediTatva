param(
  [switch]$KeepOpen
)

$mongosh = "C:\Users\satya\AppData\Local\Programs\mongosh\mongosh.exe"

if (-not (Test-Path $mongosh)) {
  Write-Error "mongosh not found at: $mongosh"
  exit 1
}

Write-Host "================ MongoDB Check ================" -ForegroundColor Cyan
Write-Host "Connecting to: mongodb://127.0.0.1:27017/meditatva" -ForegroundColor DarkCyan
Write-Host "" 

$output = & $mongosh "mongodb://127.0.0.1:27017/meditatva" --quiet --eval "JSON.stringify({db:db.getName(),collections:db.getCollectionNames(),counts:{medicines:db.medicines.countDocuments(),inventories:db.inventories.countDocuments(),invoices:db.invoices.countDocuments(),users:db.users.countDocuments()},sampleMedicines:db.medicines.find({}, {name:1,price:1,_id:0}).limit(3).toArray()},null,2)"

if ($LASTEXITCODE -ne 0) {
  Write-Error "MongoDB check failed."
  if ($KeepOpen) { Read-Host "Press Enter to close" }
  exit $LASTEXITCODE
}

$output

Write-Host "" 
Write-Host "Done." -ForegroundColor Green

if ($KeepOpen) {
  Read-Host "Press Enter to close"
}
