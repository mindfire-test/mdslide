$ErrorActionPreference = "Stop"
$Repo = "mindfiredigital/mdslide"
$BinaryName = "mdslide-windows-x64.exe"
$DownloadUrl = "https://github.com/$Repo/releases/latest/download/$BinaryName"

# Setup installation directory
$InstallBase = Join-Path $env:LOCALAPPDATA "mindfiredigital\mdslide"
$InstallBin = Join-Path $InstallBase "bin"
$DestPath = Join-Path $InstallBin "mdslide.exe"

Write-Host "Installing mdslide to $InstallBin..."

# Create directory if it doesn't exist
if (-not (Test-Path $InstallBin)) {
    New-Item -ItemType Directory -Force -Path $InstallBin | Out-Null
}

$TempPath = Join-Path $InstallBin "mdslide.exe.tmp"
$ProgressPreference = 'Continue'

try {
    # 1. Download the application binary
    Write-Host "Downloading latest version of mdslide from $DownloadUrl..."
    $webClient = New-Object System.Net.WebClient
    Register-ObjectEvent -InputObject $webClient -EventName DownloadProgressChanged -Action {
        Write-Progress -Activity "Downloading mdslide" -Status "$($EventArgs.ProgressPercentage)% complete" -PercentComplete $EventArgs.ProgressPercentage
    } | Out-Null
    Register-ObjectEvent -InputObject $webClient -EventName DownloadFileCompleted -Action {
        Write-Progress -Activity "Downloading mdslide" -Completed
    } | Out-Null

    $webClient.DownloadFileAsync([Uri]$DownloadUrl, $TempPath)
    while ($webClient.IsBusy) { Start-Sleep -Milliseconds 100 }

    # 2. Fetch the verification checksum
    Write-Host "Fetching verification checksum..."
    $ChecksumUrl = "${DownloadUrl}.sha256"
    try {
        # Fetch hash string and sanitize it (trim whitespace and extract first token)
        $ExpectedResponse = (Invoke-WebRequest -Uri $ChecksumUrl -UseBasicParsing).Content
        $ExpectedHash = ($ExpectedResponse -split '\s+')[0].Trim().ToUpper()
    }
    catch {
        throw "Security Error: Checksum file not found at $ChecksumUrl. Ensure the release contains the .sha256 asset."
    }

    # 3. Calculate actual file hash
    $ActualHash = (Get-FileHash -Path $TempPath -Algorithm SHA256).Hash.ToUpper()

    # 4. Validate file integrity
    if ($ExpectedHash -ne $ActualHash) {
        throw "Security Error: Checksum mismatch! The downloaded binary is compromised or corrupted.`nExpected: $ExpectedHash`nActual:   $ActualHash"
    }

    Write-Host "Integrity verification successful."
    Move-Item -Path $TempPath -Destination $DestPath -Force

} finally {
    if (Test-Path $TempPath) {
        Remove-Item -Path $TempPath -Force
    }
    Get-EventSubscriber | Unregister-Event
}

# Update user PATH environment variable if needed
$UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$Paths = $UserPath -split ';'
if ($Paths -notcontains $InstallBin) {
    Write-Host "Adding $InstallBin to your PATH..."
    $NewPath = "$UserPath;$InstallBin"
    [Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
    $env:PATH = "$env:PATH;$InstallBin"
}

Write-Host ""
Write-Host "mdslide was installed successfully!" -ForegroundColor Green
Write-Host "Run 'mdslide --help' to get started."
Write-Host "(Note: You may need to restart your terminal for the PATH changes to take full effect.)"
