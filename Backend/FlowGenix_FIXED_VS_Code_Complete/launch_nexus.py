"""
Nexus Launcher - FlowGenix Complete System
Launches both the React UI and Comprehensive App Blocker simultaneously
"""

import subprocess
import sys
import time
import os
import threading
from pathlib import Path

def print_banner():
    """Print the Nexus startup banner"""
    banner = """
    
    ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
    ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
    ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
    ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
    ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
    
    🚀 NEXUS - FlowGenix Complete System
    🌐 React UI + 🛡️ Comprehensive App Blocking
    
    Starting integrated focus experience...
    """
    print(banner)

def check_requirements():
    """Check if all requirements are met"""
    print("🔍 Checking system requirements...")
    
    # Check if Node.js is available
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, check=True)
        print(f"✅ Node.js: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not found. Please install Node.js to run the React app.")
        return False
    
    # Check if npm is available  
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True, check=True)
        print(f"✅ npm: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm not found. Please install npm to run the React app.")
        return False
    
    # Check if Python packages are installed
    try:
        import psutil
        import win32api
        print("✅ Python dependencies: psutil, win32api")
    except ImportError as e:
        print(f"❌ Missing Python package: {e.name}")
        print("Please install required packages: pip install psutil pywin32")
        return False
    
    # Check if package.json exists
    if not Path('package.json').exists():
        print("❌ package.json not found. Make sure you're running this from the FlowGenix project directory.")
        return False
    
    print("✅ All requirements satisfied!")
    return True

def install_dependencies():
    """Install npm dependencies if needed"""
    if not Path('node_modules').exists():
        print("📦 Installing npm dependencies...")
        try:
            subprocess.run(['npm', 'install'], check=True)
            print("✅ Dependencies installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies. Please run 'npm install' manually.")
            return False
    else:
        print("✅ Dependencies already installed.")
    return True

def start_app_blocker():
    """Start the comprehensive app blocker service"""
    print("🛡️ Starting Comprehensive App Blocker Service...")
    try:
        # Run the comprehensive app blocker
        subprocess.run([
            sys.executable, 
            'comprehensive_app_blocker.py'
        ], check=False)  # Don't check return code as this runs indefinitely
    except Exception as e:
        print(f"❌ Failed to start app blocker: {e}")

def start_react_app():
    """Start the React development server"""
    print("🌐 Starting React UI...")
    try:
        # Give app blocker a moment to start
        time.sleep(3)
        
        # Run the React app
        subprocess.run(['npm', 'start'], check=False)
    except Exception as e:
        print(f"❌ Failed to start React app: {e}")

def main():
    """Main launcher function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ System requirements not met. Please fix the issues above and try again.")
        input("Press Enter to exit...")
        return
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies.")
        input("Press Enter to exit...")
        return
    
    print("\n🚀 Launching NEXUS - Integrated FlowGenix System...")
    print("=" * 60)
    print("🛡️ COMPREHENSIVE APP BLOCKING will start first")
    print("🌐 REACT UI will start after (opens browser automatically)")
    print("=" * 60)
    print()
    print("💡 USAGE INSTRUCTIONS:")
    print("   1. The app blocker runs in the background")
    print("   2. The React UI will open in your default browser")
    print("   3. Use the React interface to start focus sessions")
    print("   4. Apps will be blocked automatically during focus time")
    print("   5. Press Ctrl+C here to stop both services")
    print()
    print("⚠️  IMPORTANT: Keep this terminal open while using the app!")
    print("=" * 60)
    print()
    
    input("Press Enter to start NEXUS...")
    
    try:
        # Start both services simultaneously using threads
        app_blocker_thread = threading.Thread(target=start_app_blocker, daemon=True)
        react_thread = threading.Thread(target=start_react_app, daemon=True)
        
        # Start the app blocker first
        app_blocker_thread.start()
        print("🛡️ App blocker service started!")
        
        # Wait a moment, then start React
        time.sleep(2)
        react_thread.start()
        print("🌐 React UI starting...")
        
        print("\n✅ NEXUS SYSTEM ACTIVE!")
        print("🔗 UI should open at: http://localhost:3000")
        print("🔗 App Blocker API at: http://localhost:8888")
        print()
        print("Press Ctrl+C to stop all services...")
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down NEXUS system...")
        print("👋 All services stopped. Thank you for using FlowGenix!")

if __name__ == "__main__":
    main()
