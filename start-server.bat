@echo off
echo Starting RAU DEV Website Local Server on http://localhost:8080 ...
start http://localhost:8080
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1" -Port 8080
