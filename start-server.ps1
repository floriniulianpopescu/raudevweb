param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataFile = Join-Path $RootDir "data\club-data.json"
$DefaultJsFile = Join-Path $RootDir "js\default-data.js"

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RAU DEV </> Local Auto-Save Server Running!" -ForegroundColor Green
Write-Host "  URL:       $Prefix" -ForegroundColor Yellow
Write-Host "  Admin PIN: 5150 (Room 515)" -ForegroundColor Cyan
Write-Host "  All Admin edits auto-save to data/club-data.json" -ForegroundColor Gray
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

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Req = $Context.Request
        $Res = $Context.Response
        $UrlPath = $Req.Url.LocalPath

        try {
            if ($UrlPath -eq "/api/data" -and $Req.HttpMethod -eq "GET") {
                $Bytes = [System.IO.File]::ReadAllBytes($DataFile)
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($Bytes, 0, $Bytes.Length)
                $Res.Close()
                continue
            }

            if ($UrlPath -eq "/api/data" -and $Req.HttpMethod -eq "POST") {
                $Reader = New-Object System.IO.StreamReader($Req.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()

                # Save to data/club-data.json and sync js/default-data.js
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

            if ($UrlPath -eq "/api/upload-resource" -and $Req.HttpMethod -eq "POST") {
                $Reader = New-Object System.IO.StreamReader($Req.InputStream, [System.Text.Encoding]::UTF8)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()

                $Payload = $Body | ConvertFrom-Json
                $SafeFolder = if ($Payload.folder -eq "solutions") { "solutions" } else { "lectures" }
                $SafeFile = [System.IO.Path]::GetFileName($Payload.filename)
                $TargetPath = Join-Path $RootDir "downloads\$SafeFolder\$SafeFile"
                [System.IO.File]::WriteAllText($TargetPath, $Payload.content, [System.Text.Encoding]::UTF8)

                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"uploaded"}')
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.StatusCode = 200
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }

            # Serve static files
            $RelPath = $UrlPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($RelPath)) {
                $RelPath = "index.html"
            }
            $FilePath = Join-Path $RootDir ($RelPath -replace '/', '\')

            if (Test-Path $FilePath -PathType Leaf) {
                $Ext = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
                $Res.ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
                if ($RelPath.StartsWith("downloads/")) {
                    $FileName = [System.IO.Path]::GetFileName($FilePath)
                    $Res.AddHeader("Content-Disposition", "attachment; filename=`"$FileName`"")
                }
                $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
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
    $Listener.Stop()
}
