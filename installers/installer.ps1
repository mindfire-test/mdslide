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

# Download the binary to a temporary location first
$TempPath = Join-Path $InstallBin "mdslide.exe.tmp"
Write-Host "Downloading latest version of mdslide from $DownloadUrl..."
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempPath -UseBasicParsing
    Move-Item -Path $TempPath -Destination $DestPath -Force
} finally {
    if (Test-Path $TempPath) {
        Remove-Item -Path $TempPath -Force
    }
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
