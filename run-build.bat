@echo off
cd /d "d:\data-projects\Its D projects\Live Running\Hotel Management\frontend"

rem Disable analytics via environment variable (bypasses all prompts)
set NG_CLI_ANALYTICS=false
set ANGULAR_CLI_ANALYTICS=false

echo Building Angular app...
npx ng build --configuration development --no-progress
echo.
echo Build exit code: %ERRORLEVEL%
