param(
    [int]$Port = 8080,
    [string]$AdminPassword = ""
)

$ErrorActionPreference = "Stop"
$RootDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$DataFile = Join-Path $RootDir "data\club-data.json"
$DefaultJsFile = Join-Path $RootDir "js\default-data.js"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RAU DEV </> Secure Web Server Setup" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Select Admin Password at the very beginning of server launch (Terminal only)
while ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    try {
        $SecStr = Read-Host "Select the Admin Password for this server session" -AsSecureString
        $Bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecStr)
        try {
            $AdminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($Bstr)
        } finally {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
        }
    } catch {
        $AdminPassword = Read-Host "Select the Admin Password for this server session"
    }

    if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
        Write-Host "Password cannot be empty. Please enter a password." -ForegroundColor Yellow
    }
}

# 2. Hash the password with PBKDF2-HMAC-SHA256 (100,000 iterations) & wipe plaintext
$Salt = New-Object byte[] 16
$Rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$Rng.GetBytes($Salt)
$Pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes(
    $AdminPassword,
    $Salt,
    100000,
    [System.Security.Cryptography.HashAlgorithmName]::SHA256
)
$PasswordHash = $Pbkdf2.GetBytes(32)
$Pbkdf2.Dispose()
$AdminPassword = $null

function Test-PasswordConstantTime([string]$Candidate) {
    if ([string]::IsNullOrEmpty($Candidate)) { return $false }
    $Derive = New-Object System.Security.Cryptography.Rfc2898DeriveBytes(
        $Candidate,
        $Salt,
        100000,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256
    )
    $CandBytes = $Derive.GetBytes(32)
    $Derive.Dispose()
    $Diff = 0
    for ($i = 0; $i -lt 32; $i++) {
        $Diff = $Diff -bor ($PasswordHash[$i] -bxor $CandBytes[$i])
    }
    return ($Diff -eq 0)
}

function New-SessionToken {
    $TokenBytes = New-Object byte[] 32
    $Rng.GetBytes($TokenBytes)
    return ([System.BitConverter]::ToString($TokenBytes) -replace '-', '').ToLowerInvariant()
}

# Active session tokens: Token -> Expiry DateTimeUtc
$ActiveTokens = @{}
# Brute-force rate limiter: IP -> @{ Count = int; LockUntil = DateTimeUtc }
$FailedLogins = @{}
$MaxFailedAttempts = 5
$LockoutMinutes = 15
$SessionHours = 4

function Test-ValidSession($Request) {
    $Token = $Request.Headers["X-Admin-Token"]
    if ([string]::IsNullOrWhiteSpace($Token) -or -not $ActiveTokens.ContainsKey($Token)) {
        return $false
    }
    $Expiry = $ActiveTokens[$Token]
    if ([DateTime]::UtcNow -gt $Expiry) {
        $ActiveTokens.Remove($Token)
        return $false
    }
    return $true
}

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RAU DEV </> Server Running at $Prefix" -ForegroundColor Green
Write-Host "  Security: PBKDF2-SHA256 + 256-bit Session Tokens + Rate Limiting" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".pptx" = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ".py"   = "text/plain; charset=utf-8"
    ".cpp"  = "text/plain; charset=utf-8"
    ".md"   = "text/markdown; charset=utf-8"
}

$AllowedUploadExtensions = @(".py", ".cpp", ".c", ".h", ".hpp", ".js", ".ts", ".java", ".md", ".txt", ".pdf", ".pptx", ".xlsx")

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Req = $Context.Request
        $Res = $Context.Response
        $UrlPath = $Req.Url.LocalPath
        $ClientIp = if ($Req.RemoteEndPoint) { $Req.RemoteEndPoint.Address.ToString() } else { "unknown" }

        # Security headers
        $Res.AddHeader("X-Content-Type-Options", "nosniff")
        $Res.AddHeader("X-Frame-Options", "DENY")

        try {
            # 1. Verify active token status
            if ($UrlPath -eq "/api/session" -and $Req.HttpMethod -eq "GET") {
                if (Test-ValidSession $Req) {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"authenticated":true}')
                    $Res.StatusCode = 200
                } else {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"authenticated":false}')
                    $Res.StatusCode = 401
                }
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # 2. Authenticate password & issue cryptographic token (with brute-force protection)
            if ($UrlPath -eq "/api/auth" -and $Req.HttpMethod -eq "POST") {
                if ($FailedLogins.ContainsKey($ClientIp)) {
                    $Entry = $FailedLogins[$ClientIp]
                    if ($Entry.LockUntil -and ([DateTime]::UtcNow -lt $Entry.LockUntil)) {
                        $WaitSec = [int][Math]::Ceiling(($Entry.LockUntil - [DateTime]::UtcNow).TotalSeconds)
                        $RespBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"authenticated`":false,`"error`":`"Too many failed attempts. Try again in $WaitSec seconds.`"}")
                        $Res.StatusCode = 429
                        $Res.ContentType = "application/json; charset=utf-8"
                        $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                        $Res.Close()
                        continue
                    }
                }

                $Reader = New-Object System.IO.StreamReader($Req.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()

                $Payload = $Body | ConvertFrom-Json
                $SubmittedPw = if ($null -ne $Payload) { [string]$Payload.password } else { "" }

                if (Test-PasswordConstantTime $SubmittedPw) {
                    if ($FailedLogins.ContainsKey($ClientIp)) {
                        $FailedLogins.Remove($ClientIp)
                    }
                    $Token = New-SessionToken
                    $ActiveTokens[$Token] = [DateTime]::UtcNow.AddHours($SessionHours)
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes("{`"authenticated`":true,`"token`":`"$Token`"}")
                    $Res.StatusCode = 200
                } else {
                    if (-not $FailedLogins.ContainsKey($ClientIp)) {
                        $FailedLogins[$ClientIp] = @{ Count = 0; LockUntil = $null }
                    }
                    $FailedLogins[$ClientIp].Count += 1
                    if ($FailedLogins[$ClientIp].Count -ge $MaxFailedAttempts) {
                        $FailedLogins[$ClientIp].LockUntil = [DateTime]::UtcNow.AddMinutes($LockoutMinutes)
                        $FailedLogins[$ClientIp].Count = 0
                    }
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"authenticated":false,"error":"Invalid password."}')
                    $Res.StatusCode = 401
                }
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # 3. Logout / Revoke session token
            if ($UrlPath -eq "/api/logout" -and $Req.HttpMethod -eq "POST") {
                $Token = $Req.Headers["X-Admin-Token"]
                if (-not [string]::IsNullOrWhiteSpace($Token) -and $ActiveTokens.ContainsKey($Token)) {
                    $ActiveTokens.Remove($Token)
                }
                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"loggedOut":true}')
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # 4. Read public club data
            if ($UrlPath -eq "/api/data" -and $Req.HttpMethod -eq "GET") {
                $Bytes = [System.IO.File]::ReadAllBytes($DataFile)
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($Bytes, 0, $Bytes.Length)
                $Res.Close()
                continue
            }

            # 5. Protected Write: Save club data (Requires valid X-Admin-Token)
            if ($UrlPath -eq "/api/data" -and $Req.HttpMethod -eq "POST") {
                if (-not (Test-ValidSession $Req)) {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unauthorized. Valid admin session token required."}')
                    $Res.ContentType = "application/json; charset=utf-8"
                    $Res.StatusCode = 401
                    $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                    $Res.Close()
                    continue
                }

                $Reader = New-Object System.IO.StreamReader($Req.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()

                # Validate JSON structure before saving
                $Parsed = $Body | ConvertFrom-Json
                if ($null -eq $Parsed.members -or $null -eq $Parsed.resources -or $null -eq $Parsed.news) {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Invalid data schema."}')
                    $Res.ContentType = "application/json; charset=utf-8"
                    $Res.StatusCode = 400
                    $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                    $Res.Close()
                    continue
                }

                [System.IO.File]::WriteAllText($DataFile, $Body, [System.Text.Encoding]::UTF8)
                $JsFallback = "// Auto-generated fallback data for offline file:// protocol support`r`nwindow.RAU_DEV_DEFAULT_DATA = $Body;"
                [System.IO.File]::WriteAllText($DefaultJsFile, $JsFallback, [System.Text.Encoding]::UTF8)

                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"saved"}')
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # 6. Protected Write: Upload resource file (Requires valid X-Admin-Token + extension whitelist)
            if ($UrlPath -eq "/api/upload-resource" -and $Req.HttpMethod -eq "POST") {
                if (-not (Test-ValidSession $Req)) {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unauthorized. Valid admin session token required."}')
                    $Res.ContentType = "application/json; charset=utf-8"
                    $Res.StatusCode = 401
                    $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                    $Res.Close()
                    continue
                }

                $Reader = New-Object System.IO.StreamReader($Req.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()

                $Payload = $Body | ConvertFrom-Json
                $SafeFolder = if ($Payload.folder -eq "solutions") { "solutions" } else { "lectures" }
                $SafeFile = [System.IO.Path]::GetFileName([string]$Payload.filename)
                $Ext = [System.IO.Path]::GetExtension($SafeFile).ToLowerInvariant()

                if ([string]::IsNullOrWhiteSpace($SafeFile) -or ($AllowedUploadExtensions -notcontains $Ext)) {
                    $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"File extension not permitted."}')
                    $Res.ContentType = "application/json; charset=utf-8"
                    $Res.StatusCode = 400
                    $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                    $Res.Close()
                    continue
                }

                $TargetPath = Join-Path $RootDir "downloads\$SafeFolder\$SafeFile"
                [System.IO.File]::WriteAllText($TargetPath, [string]$Payload.content, [System.Text.Encoding]::UTF8)

                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"uploaded"}')
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # 7. Serve static files (with path traversal protection & script blocking)
            $RelPath = $UrlPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($RelPath)) {
                $RelPath = "index.html"
            }
            $CandidatePath = [System.IO.Path]::GetFullPath((Join-Path $RootDir ($RelPath -replace '/', '\')))
            $Ext = [System.IO.Path]::GetExtension($CandidatePath).ToLowerInvariant()

            # Block access outside RootDir or to server scripts (.ps1, .bat)
            if (-not $CandidatePath.StartsWith($RootDir, [System.StringComparison]::OrdinalIgnoreCase) -or $Ext -eq ".ps1" -or $Ext -eq ".bat") {
                $Res.StatusCode = 403
                $Forbidden = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
                $Res.OutputStream.Write($Forbidden, 0, $Forbidden.Length)
                $Res.Close()
                continue
            }

            if (Test-Path $CandidatePath -PathType Leaf) {
                $Res.ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
                if ($RelPath.StartsWith("downloads/")) {
                    $FileName = [System.IO.Path]::GetFileName($CandidatePath)
                    $Res.AddHeader("Content-Disposition", "attachment; filename=`"$FileName`"")
                }
                $Bytes = [System.IO.File]::ReadAllBytes($CandidatePath)
                $Res.StatusCode = 200
                $Res.OutputStream.Write($Bytes, 0, $Bytes.Length)
            } else {
                $Res.StatusCode = 404
                $NotFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $Res.OutputStream.Write($NotFound, 0, $NotFound.Length)
            }
        } catch {
            $Res.StatusCode = 500
        } finally {
            $Res.Close()
        }
    }
} finally {
    $Rng.Dispose()
    $Listener.Stop()
}
