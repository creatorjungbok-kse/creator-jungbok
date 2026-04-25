# exchange_token.ps1 - OAuth code to refresh_token (English-only for PS5.1 compat)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== OAuth Token Exchange ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path oauth-client.json)) {
    Write-Host "ERROR: oauth-client.json not found in current folder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$config = Get-Content -Raw oauth-client.json | ConvertFrom-Json
$client = if ($config.installed) { $config.installed } else { $config.web }

Write-Host ("Client ID: " + $client.client_id.Substring(0,30) + "...") -ForegroundColor Gray
Write-Host ""
Write-Host "Paste the code= part from your browser redirect URL"
Write-Host "Example: 4/0Aci98E-XXXX  (only the code, NOT the full URL)" -ForegroundColor Gray
Write-Host ""

$code = Read-Host "code"
$code = $code.Trim()

if (-not $code) {
    Write-Host "ERROR: empty code" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Exchanging token..." -ForegroundColor Cyan

$body = @{
    code          = $code
    client_id     = $client.client_id
    client_secret = $client.client_secret
    redirect_uri  = "http://localhost"
    grant_type    = "authorization_code"
}

try {
    $response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body $body
} catch {
    Write-Host ""
    Write-Host "ERROR: token exchange failed" -ForegroundColor Red
    Write-Host ("Message: " + $_.Exception.Message) -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host ("Body: " + $sr.ReadToEnd()) -ForegroundColor Yellow
        } catch {}
    }
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not $response.refresh_token) {
    Write-Host "ERROR: no refresh_token in response" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$saveData = @{
    client_id     = $client.client_id
    client_secret = $client.client_secret
    refresh_token = $response.refresh_token
    token_uri     = "https://oauth2.googleapis.com/token"
    scopes        = ($response.scope -split " ")
    created_at    = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    account       = "creatorjungbok@gmail.com"
}

$json = $saveData | ConvertTo-Json -Depth 5
Set-Content -Path "oauth-token.json" -Value $json -Encoding UTF8

$check = Get-Content -Raw "oauth-token.json"
$size = $check.Length

if ($size -lt 100) {
    Write-Host ("ERROR: file too small - " + $size + " bytes") -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "SUCCESS" -ForegroundColor Green
Write-Host ("  refresh_token : " + $response.refresh_token.Substring(0,30) + "...") -ForegroundColor Gray
Write-Host ("  file size     : " + $size + " bytes") -ForegroundColor Gray
Write-Host ("  scopes        : " + $response.scope) -ForegroundColor Gray
Write-Host ""
Write-Host "oauth-token.json saved." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
