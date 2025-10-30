"""
Test script to demonstrate FlowGenix app blocking
This will start a focus session and show real app blocking in action
"""

import requests
import time
import subprocess
import os

BRIDGE_URL = "http://localhost:8888"

def test_api_connection():
    """Test if bridge service is running"""
    try:
        response = requests.get(f"{BRIDGE_URL}/status", timeout=5)
        if response.status_code == 200:
            print("✅ Bridge service is running!")
            return True
    except:
        pass
    print("❌ Bridge service is not running!")
    return False

def start_focus_session():
    """Start a focus session via API"""
    try:
        data = {"duration": 2}  # 2 minutes for testing
        response = requests.post(f"{BRIDGE_URL}/start", json=data, timeout=5)
        result = response.json()
        if result.get('success'):
            print(f"🚀 {result['message']}")
            return True
        else:
            print(f"❌ Failed to start: {result['message']}")
    except Exception as e:
        print(f"❌ Error starting focus: {e}")
    return False

def open_test_app():
    """Open Notepad for testing (it's in the blocked list)"""
    try:
        subprocess.Popen(['notepad.exe'])
        print("📝 Opened Notepad - this should be blocked during focus!")
    except Exception as e:
        print(f"Failed to open Notepad: {e}")

def main():
    print("🛡️ FlowGenix App Blocking Test")
    print("=" * 50)
    
    # Test connection
    if not test_api_connection():
        print("Please make sure the bridge service is running!")
        print("Run: python app_blocker_bridge_fixed.py")
        return
    
    # Start focus session
    print("\n🎯 Starting 2-minute focus session...")
    if not start_focus_session():
        return
    
    # Open test app
    print("\n📝 Opening Notepad in 3 seconds...")
    time.sleep(3)
    open_test_app()
    
    print("\n⏰ Notepad should be automatically closed by the blocker!")
    print("💡 Try opening other apps like Chrome, Discord, etc. - they'll be blocked too!")
    print("\n🔍 Watch the bridge service console for blocking messages.")
    print("⌛ Focus session will end in 2 minutes.")

if __name__ == "__main__":
    main()
