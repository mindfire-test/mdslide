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

# Download the binary with a visible percentage progress bar
$TempPath = Join-Path $InstallBin "mdslide.exe.tmp"
Write-Host "Downloading latest version of mdslide from $DownloadUrl..."

$ProgressPreference = 'Continue'
try {
    $webClient = New-Object System.Net.WebClient
    Register-ObjectEvent -InputObject $webClient -EventName DownloadProgressChanged -Action {
        Write-Progress -Activity "Downloading mdslide" -Status "$($EventArgs.ProgressPercentage)% complete" -PercentComplete $EventArgs.ProgressPercentage
    } | Out-Null
    Register-ObjectEvent -InputObject $webClient -EventName DownloadFileCompleted -Action {
        Write-Progress -Activity "Downloading mdslide" -Completed
    } | Out-Null

    $webClient.DownloadFileAsync([Uri]$DownloadUrl, $TempPath)
    while ($webClient.IsBusy) { Start-Sleep -Milliseconds 100 }

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