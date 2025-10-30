"""
FlowGenix Import Test - Verify all dependencies are working
"""

def test_imports():
    """Test all required imports for FlowGenix system"""
    print("🧪 Testing FlowGenix dependencies...")
    
    try:
        import json
        print("✅ json - Built-in module OK")
    except ImportError as e:
        print(f"❌ json import failed: {e}")
        return False
    
    try:
        import time
        print("✅ time - Built-in module OK")
    except ImportError as e:
        print(f"❌ time import failed: {e}")
        return False
    
    try:
        import threading
        print("✅ threading - Built-in module OK")
    except ImportError as e:
        print(f"❌ threading import failed: {e}")
        return False
    
    try:
        from datetime import datetime, timedelta
        print("✅ datetime - Built-in module OK")
    except ImportError as e:
        print(f"❌ datetime import failed: {e}")
        return False
    
    try:
        from http.server import HTTPServer, BaseHTTPRequestHandler
        print("✅ http.server - Built-in module OK")
    except ImportError as e:
        print(f"❌ http.server import failed: {e}")
        return False
    
    try:
        import psutil
        print(f"✅ psutil - Version {psutil.__version__} OK")
    except ImportError as e:
        print(f"❌ psutil import failed: {e}")
        print("💡 Install with: pip install psutil")
        return False
    
    try:
        import win32api
        import win32con
        import win32gui
        print("✅ pywin32 - Windows API modules OK")
    except ImportError as e:
        print(f"❌ pywin32 import failed: {e}")
        print("💡 Install with: pip install pywin32")
        return False
    
    try:
        import subprocess
        print("✅ subprocess - Built-in module OK")
    except ImportError as e:
        print(f"❌ subprocess import failed: {e}")
        return False
    
    try:
        import os
        print("✅ os - Built-in module OK")
    except ImportError as e:
        print(f"❌ os import failed: {e}")
        return False
    
    try:
        import socket
        print("✅ socket - Built-in module OK")
    except ImportError as e:
        print(f"❌ socket import failed: {e}")
        return False
    
    print("\n🎉 ALL DEPENDENCIES OK! FlowGenix is ready to run!")
    return True

def test_system_requirements():
    """Test system requirements"""
    print("\n🔧 Testing system requirements...")
    
    import platform
    import psutil
    print(f"✅ Platform: {platform.system()} {platform.release()}")
    
    import sys
    print(f"✅ Python: {sys.version}")
    
    if sys.version_info < (3, 8):
        print("⚠️ Warning: Python 3.8+ recommended")
    else:
        print("✅ Python version OK")
    
    # Test process access
    try:
        processes = list(psutil.process_iter(['pid', 'name']))
        print(f"✅ Process access OK - Found {len(processes)} running processes")
    except Exception as e:
        print(f"❌ Process access failed: {e}")
        return False
    
    # Test Windows API access
    try:
        import win32gui
        desktop = win32gui.GetDesktopWindow()
        print("✅ Windows API access OK")
    except Exception as e:
        print(f"❌ Windows API access failed: {e}")
        return False
    
    print("✅ System requirements met!")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("🛡️ FlowGenix Ultra-Restrictive System - Import Test")
    print("=" * 60)
    
    imports_ok = test_imports()
    system_ok = test_system_requirements()
    
    if imports_ok and system_ok:
        print("\n🎯 READY TO RUN! All tests passed!")
        print("💡 You can now run comprehensive_app_blocker.py")
    else:
        print("\n❌ SETUP REQUIRED! Please install missing dependencies.")
        print("💡 Run: pip install -r requirements.txt")
    
    print("\n" + "=" * 60)
    input("Press Enter to continue...")
