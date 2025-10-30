"""
FlowGenix Unified Launcher - Starts both the blocker service AND the UI
"""

import os
import sys
import time
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver
import json
from comprehensive_app_blocker import ComprehensiveBlockerService, BridgeRequestHandler

# Global instances
unified_blocker_service = None
ui_server = None

class FlowGenixUIHandler(SimpleHTTPRequestHandler):
    """Custom handler for FlowGenix UI files"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom logging for UI server"""
        timestamp = time.strftime('%H:%M:%S')
        print(f"[UI-{timestamp}] {format % args}")

class UnifiedBridgeHandler(BridgeRequestHandler):
    """Unified handler that serves both API and UI"""
    
    def do_GET(self):
        """Handle GET requests for both API and UI"""
        global unified_blocker_service
        if self.path.startswith('/api/'):
            # API endpoints
            api_path = self.path[4:]  # Remove '/api' prefix
            self.path = api_path
            super().do_GET()
        elif self.path == '/status':
            # Blocker status endpoint
            self.send_json_response(unified_blocker_service.get_status())
        elif self.path == '/health':
            # Health check endpoint
            self.send_json_response({'status': 'healthy', 'service': 'flowgenix_unified'})
        elif self.path == '/':
            # Serve main FlowGenix UI
            self.serve_ui_file('flowgenix-integrated.html')
        elif self.path == '/integrated':
            self.serve_ui_file('flowgenix-integrated.html')
        elif self.path == '/colorful':
            self.serve_ui_file('flowgenix-colorful.html')
        elif self.path == '/standalone':
            self.serve_ui_file('flowgenix-standalone.html')
        elif self.path == '/test':
            self.serve_ui_file('test_connection.html')
        else:
            # Serve static files
            self.serve_static_file()
    
    def do_POST(self):
        """Handle POST requests"""
        global unified_blocker_service
        try:
            if self.path.startswith('/api/'):
                # API endpoints
                api_path = self.path[4:]  # Remove '/api' prefix
                self.path = api_path
                super().do_POST()
            elif self.path in ['/start', '/stop']:
                # Handle blocker API calls directly
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    data = json.loads(post_data.decode('utf-8'))
                else:
                    data = {}
                    
                if self.path == '/start':
                    duration = data.get('duration', 25)
                    response = unified_blocker_service.start_focus_mode(duration)
                    self.send_json_response(response)
                elif self.path == '/stop':
                    response = unified_blocker_service.stop_focus_mode()
                    self.send_json_response(response)
            else:
                self.send_json_response({'error': 'Not found'}, 404)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_ui_file(self, filename):
        """Serve UI HTML files"""
        try:
            file_path = os.path.join(os.path.dirname(__file__), filename)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
            else:
                self.send_json_response({'error': f'File {filename} not found'}, 404)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def serve_static_file(self):
        """Serve static files (CSS, JS, etc.)"""
        try:
            # Remove leading slash and get file path
            file_path = self.path.lstrip('/')
            full_path = os.path.join(os.path.dirname(__file__), file_path)
            
            if os.path.exists(full_path) and os.path.isfile(full_path):
                # Determine content type
                if file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.json'):
                    content_type = 'application/json'
                elif file_path.endswith('.html'):
                    content_type = 'text/html'
                else:
                    content_type = 'text/plain'
                
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-type', f'{content_type}; charset=utf-8')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
            else:
                self.send_json_response({'error': 'File not found'}, 404)
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)

def start_unified_service():
    """Start the unified FlowGenix service (blocker + UI)"""
    global unified_blocker_service
    
    print("🛡️ Starting FlowGenix UNIFIED Service...")
    print("📱 This service provides BOTH the ultra-restrictive blocker AND the web UI!")
    
    try:
        # Create blocker service instance
        unified_blocker_service = ComprehensiveBlockerService()
        
        # Create unified HTTP server (blocker API + UI)
        port = 8888
        httpd = HTTPServer(('localhost', port), UnifiedBridgeHandler)
        
        print(f"🌐 FlowGenix Unified Service running on http://localhost:{port}")
        print(f"🛡️ Ultra-restrictive blocker ready to block {len(unified_blocker_service.blocked_apps)} app types!")
        print(f"🎯 FlowGenix UI accessible at:")
        print(f"   • Main UI: http://localhost:{port}/")
        print(f"   • Integrated: http://localhost:{port}/integrated")
        print(f"   • Colorful: http://localhost:{port}/colorful") 
        print(f"   • Standalone: http://localhost:{port}/standalone")
        print(f"   • Test: http://localhost:{port}/test")
        print("\\n" + "="*60)
        print("🎯 UNIFIED FLOWGENIX FEATURES:")
        print("  • ✅ Web UI served at localhost:8888")
        print("  • ✅ Ultra-restrictive app blocking")
        print("  • ✅ Real-time process monitoring")
        print("  • ✅ FlowGenix browser protection")
        print("  • ✅ API endpoints for focus control")
        print("  • ✅ Emergency communication allowed (WhatsApp, Phone)")
        print("="*60)
        print("\\nPress Ctrl+C to stop the unified service\\n")
        
        # Auto-open browser to FlowGenix UI
        def open_browser():
            time.sleep(2)  # Wait for server to be ready
            try:
                print("🌐 Auto-opening FlowGenix UI in browser...")
                webbrowser.open(f'http://localhost:{port}/')
            except Exception as e:
                print(f"⚠️ Could not auto-open browser: {e}")
                print(f"💡 Manually open: http://localhost:{port}/")
        
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Start server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\\n👋 FlowGenix Unified Service stopped")
    except Exception as e:
        print(f"❌ Error starting unified service: {e}")
        input("Press Enter to exit...")

def main():
    """Main entry point"""
    print("🛡️ FlowGenix UNIFIED Launcher Starting...")
    print("🎯 Starting both Ultra-Restrictive Blocker AND Web UI!")
    
    # Check if we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check for required files
    required_files = [
        'flowgenix-integrated.html',
        'comprehensive_app_blocker.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        print("💡 Make sure you're running from the FlowGenix directory")
        input("Press Enter to exit...")
        return
    
    # Start the unified service
    start_unified_service()

if __name__ == "__main__":
    main()
