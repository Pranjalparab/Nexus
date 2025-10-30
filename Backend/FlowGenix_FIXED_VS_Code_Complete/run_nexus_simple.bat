@echo off
echo.
echo ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
echo ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
echo ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
echo ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
echo ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
echo ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo 🚀 NEXUS - FlowGenix Complete System (Simple Mode)
echo 🛡️ Comprehensive App Blocking + 🌐 Standalone UI
echo.

echo 🌐 Opening FlowGenix Integrated UI...
start flowgenix-integrated.html

echo.
echo 🛡️ Starting Comprehensive App Blocker...
echo ⚠️  IMPORTANT: Keep this window open while using the app!
echo 📱 The blocker will prevent ALL distracting apps from running
echo 💡 Use the web interface to control focus sessions
echo.
echo Press Ctrl+C to stop the app blocker when done.
echo.

python comprehensive_app_blocker.py

echo.
echo 👋 NEXUS system stopped. Thank you for using FlowGenix!
pause
