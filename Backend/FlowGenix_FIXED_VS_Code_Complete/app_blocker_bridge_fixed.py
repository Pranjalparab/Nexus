"""
FlowGenix App Blocker Bridge - Fixed Version
Communication between Web App and Win32 Blocker
"""

import json
import time
import threading
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import psutil
import win32api
import win32con

# Global service instance
app_blocker_service = None

class AppBlockerService:
    def __init__(self):
        self.focus_active = False
        self.focus_end_time = None
        self.monitoring_thread = None
        self.blocked_apps = [
            'chrome.exe', 'firefox.exe',  
            'Discord.exe', 'WhatsApp.exe', 'Telegram.exe',
            'Steam.exe', 'EpicGamesLauncher.exe', 
            'Spotify.exe', 'Netflix.exe', 'VLC.exe',
            'notepad.exe'  # For testing
        ]
        
        self.essential_apps = [
            'explorer.exe', 'winlogon.exe', 'csrss.exe', 'wininit.exe',
            'services.exe', 'lsass.exe', 'svchost.exe', 'dwm.exe',
            'python.exe', 'pythonw.exe'
        ]
        
    def start_focus_mode(self, duration_minutes):
        """Start focus mode with real app blocking"""
        try:
            if self.focus_active:
                return {'success': False, 'message': 'Focus mode already active'}
                
            self.focus_end_time = datetime.now() + timedelta(minutes=duration_minutes)
            self.focus_active = True
            
            # Start monitoring thread
            if self.monitoring_thread is None or not self.monitoring_thread.is_alive():
                self.monitoring_thread = threading.Thread(target=self.monitor_apps, daemon=True)
                self.monitoring_thread.start()
                
            print(f"✅ Focus mode started for {duration_minutes} minutes")
            return {
                'success': True, 
                'message': f'Focus mode started for {duration_minutes} minutes',
                'end_time': self.focus_end_time.isoformat()
            }
        except Exception as e:
            print(f"❌ Error starting focus mode: {e}")
            return {'success': False, 'message': f'Error starting focus mode: {str(e)}'}
    
    def stop_focus_mode(self):
        """Stop focus mode"""
        self.focus_active = False
        self.focus_end_time = None
        print("🛑 Focus mode stopped")
        return {'success': True, 'message': 'Focus mode stopped'}
    
    def get_status(self):
        """Get current focus status"""
        if self.focus_active and self.focus_end_time:
            remaining = self.focus_end_time - datetime.now()
            if remaining.total_seconds() > 0:
                return {
                    'active': True,
                    'remaining_seconds': int(remaining.total_seconds()),
                    'end_time': self.focus_end_time.isoformat()
                }
            else:
                self.focus_active = False
                return {'active': False}
        return {'active': False}
    
    def monitor_apps(self):
        """Monitor and block apps using Win32 APIs"""
        blocked_count = 0
        print("🔍 Starting app monitoring...")
        
        while self.focus_active and datetime.now() < self.focus_end_time:
            try:
                for process in psutil.process_iter(['pid', 'name']):
                    try:
                        process_name = process.info['name']
                        
                        # Check if should be blocked
                        if (process_name.lower() in [app.lower() for app in self.blocked_apps] and 
                            process_name.lower() not in [app.lower() for app in self.essential_apps]):
                            
                            # Terminate using Win32 API
                            if self.terminate_process(process.info['pid'], process_name):
                                blocked_count += 1
                                print(f"🚫 Blocked: {process_name} (Total: {blocked_count})")
                            
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
                        
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"⚠️ Monitoring error: {e}")
                continue
                
        # Focus ended
        if self.focus_active:
            self.focus_active = False
            print(f"🎉 Focus session complete! Blocked {blocked_count} app launches.")
    
    def terminate_process(self, pid, process_name):
        """Terminate process using Win32 API"""
        try:
            process_handle = win32api.OpenProcess(
                win32con.PROCESS_TERMINATE | win32con.PROCESS_QUERY_INFORMATION,
                False, pid
            )
            win32api.TerminateProcess(process_handle, 1)
            win32api.CloseHandle(process_handle)
            return True
        except Exception as e:
            # Don't print every error to avoid spam
            return False

class BridgeRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/status':
            self.send_json_response(app_blocker_service.get_status())
        else:
            self.send_json_response({'error': 'Not found'}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/start':
                duration = data.get('duration', 25)
                response = app_blocker_service.start_focus_mode(duration)
                self.send_json_response(response)
                
            elif self.path == '/stop':
                response = app_blocker_service.stop_focus_mode()
                self.send_json_response(response)
                
            else:
                self.send_json_response({'error': 'Not found'}, 404)
                
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        return

def main():
    global app_blocker_service
    
    print("🛡️ Starting FlowGenix App Blocker Bridge Service...")
    print("This service enables real app blocking from the web interface.")
    
    try:
        # Create service instance
        app_blocker_service = AppBlockerService()
        
        # Create HTTP server
        port = 8888
        httpd = HTTPServer(('localhost', port), BridgeRequestHandler)
        
        print(f"🌐 Bridge service running on http://localhost:{port}")
        print("🚫 Real app blocking is now active!")
        print("💡 You can now use the web app with real blocking functionality")
        print("\nPress Ctrl+C to stop the service\n")
        
        # Start server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n👋 FlowGenix Bridge Service stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
