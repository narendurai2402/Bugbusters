$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\nivet\OneDrive\Documents\Project\Hackathon"
$backendDir = "$projectRoot\mendmind\backend"
$frontendDir = "$projectRoot\mendmind\frontend"

# Replace these with your real Gmail app credentials before running the script.
$gmailUser = "nivethan0428@gmail.com"
$gmailAppPassword = "qcww vgxe cgbu lsjn"

$backendCommand = @"
& '$projectRoot\venv\Scripts\Activate.ps1'
`$env:PYTHONPATH = '$backendDir'
`$env:OLLAMA_MODEL = 'llama3.2:latest'
`$env:SMTP_HOST = 'smtp.gmail.com'
`$env:SMTP_PORT = '587'
`$env:SMTP_USERNAME = '$gmailUser'
`$env:SMTP_PASSWORD = '$gmailAppPassword'
`$env:SMTP_FROM = '$gmailUser'
`$env:SMTP_STARTTLS = 'true'
`$env:SMTP_USE_SSL = 'false'
`$env:OTP_HASH_SECRET = 'a-long-random-secret'
Write-Host 'Starting MendMind backend...'
python -m uvicorn main:app --host 0.0.0.0 --port 8000
"@

$frontendCommand = @"
Write-Host 'Starting MendMind frontend...'
npm run dev
"@

Start-Process powershell.exe -WorkingDirectory $backendDir -ArgumentList @('-NoLogo', '-NoProfile', '-NoExit', '-Command', $backendCommand)
Start-Process powershell.exe -WorkingDirectory $frontendDir -ArgumentList @('-NoLogo', '-NoProfile', '-NoExit', '-Command', $frontendCommand)

Write-Host "MendMind startup launched."
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend docs: http://localhost:8000/docs"
Write-Host "Health check: http://localhost:8000/api/health"
Write-Host ""
Write-Host "IMPORTANT: replace the Gmail placeholders with your real app password before running this script."
Write-Host "For Gmail, use a generated App Password, not your normal Gmail password."
Write-Host "This is still a local demo social-auth setup; no external OAuth credentials are required."
