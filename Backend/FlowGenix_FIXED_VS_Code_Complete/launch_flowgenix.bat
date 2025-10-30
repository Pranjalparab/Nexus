@echo off
echo 🚀 Starting FlowGenix - Focus & Productivity System
echo ==================================================

echo.
echo 🛡️ Starting App Blocker Bridge Service...
start "FlowGenix Bridge Service" /MIN python app_blocker_bridge_fixed.py

echo.
echo ⏳ Waiting for service to start...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Opening FlowGenix Web App...
start "" "flowgenix-colorful.html"

echo.
echo ✅ FlowGenix is now running!
echo.
echo 📋 What's Active:
echo    • Web App - Beautiful productivity interface
echo    • Bridge Service - Real app blocking API
echo    • App Blocking - Windows-level app termination
echo.
echo 💡 How to Use:
echo    1. Login to the web app with any credentials
echo    2. Choose your favorite theme
echo    3. Start a focus session from the Timer
echo    4. Watch as distracting apps get blocked!
echo.
echo 🚫 Apps that will be blocked:
echo    • Browsers: Chrome, Firefox, Edge
echo    • Social: Discord, WhatsApp, Telegram  
echo    • Gaming: Steam, Epic Games, etc.
echo    • Entertainment: Spotify, Netflix, VLC
echo    • And more!
echo.
echo 🔧 The bridge service window is minimized.
echo    Close it to stop app blocking functionality.
echo.
pause
