param(
  [string[]]$Buckets = @(
    "clinci-dr-gunda.firebasestorage.app",
    "ab-labs-91f38.firebasestorage.app"
  )
)

$ErrorActionPreference = "Stop"
$corsFile = Join-Path $PSScriptRoot "..\firebase-storage-cors.json"

if (-not (Test-Path -LiteralPath $corsFile)) {
  throw "Missing CORS config: $corsFile"
}

$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
$gsutil = Get-Command gsutil -ErrorAction SilentlyContinue

if ($gcloud) {
  foreach ($bucket in $Buckets) {
    & gcloud storage buckets update "gs://$bucket" "--cors-file=$corsFile"
  }
  exit 0
}

if ($gsutil) {
  foreach ($bucket in $Buckets) {
    & gsutil cors set $corsFile "gs://$bucket"
  }
  exit 0
}

throw "Install Google Cloud CLI first, then run: .\scripts\apply-firebase-storage-cors.ps1"
