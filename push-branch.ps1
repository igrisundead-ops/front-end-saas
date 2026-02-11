[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$CommitMessage = "",
    [switch]$AllowMain
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-WarningLog {
    param([Parameter(Mandatory = $true)][string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Format-GitCommand {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $quotedArgs = $Arguments | ForEach-Object {
        if ($_ -match "\s") { '"' + $_.Replace('"', '\"') + '"' } else { $_ }
    }

    return "git $($quotedArgs -join ' ')"
}

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $rawOutput = & git @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $outputText = ($rawOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine

    if ($exitCode -ne 0) {
        $commandText = Format-GitCommand -Arguments $Arguments
        $details = if ([string]::IsNullOrWhiteSpace($outputText)) { "(no output)" } else { $outputText }
        throw "Command failed ($exitCode): $commandText`n$details"
    }

    return $outputText.Trim()
}

try {
    # Step 1: Verify git is available and we are inside a repository.
    Write-Info "Checking Git installation..."
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if (-not $gitCmd) {
        throw "Git is not installed or not available on PATH."
    }
    Write-Success "Git executable found."

    Write-Info "Validating current folder is inside a Git repository..."
    $insideRepo = Invoke-Git -Arguments @("rev-parse", "--is-inside-work-tree")
    if ($insideRepo -ne "true") {
        throw "This script must be run inside a Git working tree."
    }
    Write-Success "Repository detected."

    # Step 2: Detect current branch and guard against accidental main/master pushes.
    Write-Info "Detecting current branch..."
    $branchName = Invoke-Git -Arguments @("rev-parse", "--abbrev-ref", "HEAD")
    if ([string]::IsNullOrWhiteSpace($branchName) -or $branchName -eq "HEAD") {
        throw "Could not resolve a branch name (detached HEAD). Check out a branch first."
    }
    Write-Success "Current branch: $branchName"

    if (($branchName -eq "main" -or $branchName -eq "master") -and -not $AllowMain.IsPresent) {
        throw "Refusing to push '$branchName'. Re-run with -AllowMain if this is intentional."
    }

    # Step 3: Ensure origin exists before doing any local changes.
    Write-Info "Verifying 'origin' remote exists..."
    $null = Invoke-Git -Arguments @("remote", "get-url", "origin")
    Write-Success "Origin remote is configured."

    # Step 4: Check working tree status.
    Write-Info "Checking for uncommitted changes..."
    $statusOutput = Invoke-Git -Arguments @("status", "--porcelain")
    $hasChanges = -not [string]::IsNullOrWhiteSpace($statusOutput)

    if ($hasChanges) {
        Write-WarningLog "Uncommitted changes detected."

        # Step 5: Commit current changes with provided message or safe default.
        $resolvedCommitMessage = if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
            "chore: auto-commit before push on $branchName ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
        } else {
            $CommitMessage
        }

        Write-Info "Staging changes (git add -A)..."
        if ($PSCmdlet.ShouldProcess("working tree", "git add -A")) {
            $null = Invoke-Git -Arguments @("add", "-A")
            Write-Success "Changes staged."
        } else {
            Write-WarningLog "Staging skipped due to -WhatIf."
        }

        Write-Info "Creating commit..."
        if ($PSCmdlet.ShouldProcess("branch '$branchName'", "git commit")) {
            $commitOutput = Invoke-Git -Arguments @("commit", "-m", $resolvedCommitMessage)
            Write-Success "Commit created."
            if (-not [string]::IsNullOrWhiteSpace($commitOutput)) {
                Write-Host $commitOutput
            }
        } else {
            Write-WarningLog "Commit skipped due to -WhatIf."
        }
    } else {
        Write-Success "No uncommitted changes found. Skipping commit step."
    }

    # Step 6: Push current branch to origin with upstream tracking.
    Write-Info "Pushing current branch to origin with upstream tracking..."
    if ($PSCmdlet.ShouldProcess("origin/$branchName", "git push -u origin $branchName")) {
        $pushOutput = Invoke-Git -Arguments @("push", "-u", "origin", $branchName)
        Write-Success "Push completed for branch '$branchName'."
        if (-not [string]::IsNullOrWhiteSpace($pushOutput)) {
            Write-Host $pushOutput
        }
    } else {
        Write-WarningLog "Push skipped due to -WhatIf."
    }
}
catch {
    $message = $_.Exception.Message
    Write-Host "[ERROR] $message" -ForegroundColor Red
    exit 1
}
