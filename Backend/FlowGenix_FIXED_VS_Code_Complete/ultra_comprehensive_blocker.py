"""
FlowGenix ULTRA COMPREHENSIVE Blocker
This version blocks EVERYTHING - all apps, all websites, all distractions
Uses multiple blocking methods for maximum effectiveness
"""

import json
import time
import threading
import subprocess
import os
import sys
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import psutil
import win32api
import win32con
import win32gui
import win32process
import ctypes
from ctypes import wintypes
import tempfile

# Global service instance
ultra_blocker_service = None

class UltraComprehensiveBlocker:
    def __init__(self):
        self.focus_active = False
        self.focus_end_time = None
        self.monitoring_threads = []
        self.blocked_count = 0
        self.original_hosts = None
        self.temp_firewall_rules = []
        
        # EVERYTHING that should be blocked (expanded list)
        self.blocked_processes = [
            # ALL WEB BROWSERS - Block internet access completely
            'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe', 'safari.exe',
            'iexplore.exe', 'chromium.exe', 'brave.exe', 'vivaldi.exe', 'edge.exe',
            'GoogleChromePortable.exe', 'FirefoxPortable.exe',
            
            # SOCIAL MEDIA & COMMUNICATION
            'Discord.exe', 'WhatsApp.exe', 'Telegram.exe', 'Skype.exe',
            'slack.exe', 'teams.exe', 'zoom.exe', 'FacebookMessenger.exe',
            'Instagram.exe', 'TikTok.exe', 'snapchat.exe', 'Signal.exe',
            'Viber.exe', 'Line.exe', 'WeChat.exe',
            
            # ALL GAMING - Everything gaming related
            'Steam.exe', 'steamwebhelper.exe', 'EpicGamesLauncher.exe', 'RiotClientServices.exe',
            'Battle.net.exe', 'Origin.exe', 'Uplay.exe', 'GOGGalaxy.exe',
            'LeagueofLegends.exe', 'Valorant.exe', 'Minecraft.exe', 'MinecraftLauncher.exe',
            'Roblox.exe', 'RobloxPlayerBeta.exe', 'FortniteClient-Win64-Shipping.exe',
            'WorldOfWarcraft.exe', 'Overwatch.exe', 'ApexLegends.exe',
            'CounterStrike.exe', 'csgo.exe', 'dota2.exe', 'pubg.exe',
            'RocketLeague.exe', 'FallGuys.exe', 'AmongUs.exe',
            
            # ENTERTAINMENT & MEDIA - All entertainment
            'Spotify.exe', 'Netflix.exe', 'VLC.exe', 'vlc.exe', 'PotPlayer.exe',
            'iTunes.exe', 'WindowsMediaPlayer.exe', 'AmazonMusic.exe',
            'YouTubeMusic.exe', 'Hulu.exe', 'DisneyPlus.exe', 'HBO.exe',
            'Twitch.exe', 'TwitchStudio.exe', 'obs64.exe', 'obs.exe', 'streamlabs obs.exe',
            'Audacity.exe', 'VLCMediaPlayer.exe', 'MediaPlayerClassic.exe',
            
            # SHOPPING & E-COMMERCE
            'Amazon.exe', 'eBay.exe', 'Etsy.exe', 'AliExpress.exe', 'Walmart.exe',
            'BestBuy.exe', 'Target.exe',
            
            # CREATIVE SOFTWARE (potentially distracting)
            'Photoshop.exe', 'Premiere.exe', 'AfterEffects.exe', 'Illustrator.exe',
            'Blender.exe', 'Unity.exe', 'UnrealEngine.exe', 'Maya.exe',
            'Cinema4D.exe', 'DaVinciResolve.exe',
            
            # NEWS & READING
            'Reddit.exe', 'Flipboard.exe', 'Feedly.exe', 'Medium.exe',
            'NewYorkTimes.exe', 'CNN.exe', 'BBC.exe',
            
            # OFFICE DISTRACTIONS (non-essential office apps)
            'OneNote.exe', 'Evernote.exe', 'Notion.exe', 'Obsidian.exe',
            
            # SYSTEM APPS THAT CAN BE DISTRACTING
            'MSPaint.exe', 'Paint.exe', 'SnippingTool.exe', 'calc.exe',
            'notepad.exe', 'wordpad.exe', 'mspaint.exe',
            
            # DEVELOPMENT TOOLS (social aspects)
            'GitHubDesktop.exe', 'GitKraken.exe', 'SourceTree.exe',
            
            # TORRENTING & FILE SHARING
            'utorrent.exe', 'BitTorrent.exe', 'qBittorrent.exe', 'Deluge.exe',
            
            # MISC POTENTIALLY DISTRACTING
            'WindowsStore.exe', 'Calculator.exe', 'Photos.exe', 'Movies.exe',
            'GrooveMusic.exe', 'MicrosoftSolitaire.exe',
        ]
        
        # CRITICAL SYSTEM PROCESSES - NEVER BLOCK THESE
        self.essential_processes = [
            # Core Windows System
            'System', 'Registry', 'smss.exe', 'csrss.exe', 'wininit.exe',
            'winlogon.exe', 'services.exe', 'lsass.exe', 'svchost.exe',
            'explorer.exe', 'dwm.exe', 'RuntimeBroker.exe', 'SearchIndexer.exe',
            
            # Security & Updates
            'MsMpEng.exe', 'SecurityHealthService.exe', 'WindowsSecurityService.exe',
            'MpDefenderCoreService.exe', 'smartscreen.exe',
            
            # System Management
            'taskmgr.exe', 'SystemSettings.exe', 'ControlPanel.exe',
            'regedit.exe', 'cmd.exe', 'powershell.exe', 'powershell_ise.exe',
            
            # FlowGenix System
            'python.exe', 'pythonw.exe',  # Our blocker service
            
            # Essential Work Applications
            'WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'OUTLOOK.EXE',
            'AcroRd32.exe', 'Acrobat.exe', 'notepad++.exe',
            'Code.exe', 'devenv.exe', 'pycharm64.exe', 'idea64.exe',
            'sublime_text.exe', 'atom.exe',
            
            # Emergency Communication
            'Phone.exe', 'CallApp.exe', 'EmergencyCall.exe',
        ]
        
        # Distracting websites to block via hosts file
        self.blocked_domains = [
            'facebook.com', 'www.facebook.com', 'm.facebook.com',
            'twitter.com', 'www.twitter.com', 'mobile.twitter.com', 'x.com', 'www.x.com',
            'instagram.com', 'www.instagram.com',
            'tiktok.com', 'www.tiktok.com',
            'youtube.com', 'www.youtube.com', 'm.youtube.com',
            'reddit.com', 'www.reddit.com', 'm.reddit.com',
            'netflix.com', 'www.netflix.com',
            'twitch.tv', 'www.twitch.tv',
            'discord.com', 'www.discord.com',
            'whatsapp.com', 'web.whatsapp.com', 'www.whatsapp.com',
            'telegram.org', 'web.telegram.org', 'www.telegram.org',
            'amazon.com', 'www.amazon.com', 'amazon.co.uk', 'amazon.de',
            'ebay.com', 'www.ebay.com',
            'aliexpress.com', 'www.aliexpress.com',
            'steam.com', 'store.steampowered.com', 'steamcommunity.com',
            'epicgames.com', 'www.epicgames.com', 'store.epicgames.com',
            'riotgames.com', 'www.riotgames.com',
            'blizzard.com', 'www.blizzard.com', 'battle.net',
            'spotify.com', 'open.spotify.com', 'www.spotify.com',
            'news.ycombinator.com', 'hackernews.com',
            'medium.com', 'www.medium.com',
            'pinterest.com', 'www.pinterest.com',
            'linkedin.com', 'www.linkedin.com',
            'snapchat.com', 'www.snapchat.com',
            'buzzfeed.com', 'www.buzzfeed.com',
            '9gag.com', 'www.9gag.com',
            'imgur.com', 'www.imgur.com',
            'tumblr.com', 'www.tumblr.com',
            'vimeo.com', 'www.vimeo.com',
            'dailymotion.com', 'www.dailymotion.com',
        ]
    
    def start_comprehensive_blocking(self, duration_minutes):
        """Start ULTRA comprehensive blocking of everything"""
        try:
            if self.focus_active:
                return {'success': False, 'message': 'Ultra blocking already active'}
            
            self.focus_end_time = datetime.now() + timedelta(minutes=duration_minutes)
            self.focus_active = True
            self.blocked_count = 0
            
            print(f"🔥 STARTING ULTRA COMPREHENSIVE BLOCKING for {duration_minutes} minutes!")
            print(f"🚫 Blocking {len(self.blocked_processes)} app types")
            print(f"🌐 Blocking {len(self.blocked_domains)} website domains")
            
            # Start multiple blocking methods simultaneously
            self.start_process_monitor()
            self.block_websites_via_hosts()
            self.start_window_monitor()
            self.start_aggressive_terminator()
            
            return {
                'success': True,
                'message': f'ULTRA comprehensive blocking active for {duration_minutes} minutes - ALL distractions blocked!',
                'blocked_processes': len(self.blocked_processes),
                'blocked_domains': len(self.blocked_domains),
                'end_time': self.focus_end_time.isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error starting ultra blocking: {e}")
            return {'success': False, 'message': f'Failed to start: {str(e)}'}
    
    def stop_comprehensive_blocking(self):
        """Stop all blocking"""
        self.focus_active = False
        self.restore_websites()
        print(f"🏁 ULTRA BLOCKING STOPPED - Total blocked: {self.blocked_count}")
        return {'success': True, 'message': f'Ultra blocking stopped. Blocked {self.blocked_count} attempts.'}
    
    def start_process_monitor(self):
        """Monitor and instantly terminate blocked processes"""
        def process_monitor():
            print("🔍 Process monitor started - checking every 0.5 seconds")
            while self.focus_active and datetime.now() < self.focus_end_time:
                try:
                    for process in psutil.process_iter(['pid', 'name']):
                        try:
                            process_name = process.info['name']
                            if (process_name.lower() in [app.lower() for app in self.blocked_processes] and
                                process_name.lower() not in [app.lower() for app in self.essential_processes]):
                                
                                self.ultra_kill_process(process.info['pid'], process_name)
                                self.blocked_count += 1
                                print(f"🔥 KILLED: {process_name} (Total: {self.blocked_count})")
                        
                        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                            continue
                    
                    time.sleep(0.5)  # Check every 500ms for maximum effectiveness
                except Exception as e:
                    print(f"Process monitor error: {e}")
                    continue
        
        thread = threading.Thread(target=process_monitor, daemon=True)
        thread.start()
        self.monitoring_threads.append(thread)
    
    def start_window_monitor(self):
        """Monitor windows and close distracting ones"""
        def window_monitor():
            print("🪟 Window monitor started")
            while self.focus_active and datetime.now() < self.focus_end_time:
                try:
                    def enum_windows_callback(hwnd, windows):
                        if win32gui.IsWindowVisible(hwnd):
                            window_title = win32gui.GetWindowText(hwnd).lower()
                            class_name = win32gui.GetClassName(hwnd).lower()
                            
                            # Check for distracting window titles or classes
                            distracting_keywords = [
                                'facebook', 'twitter', 'instagram', 'tiktok', 'youtube',
                                'reddit', 'discord', 'whatsapp', 'telegram', 'steam',
                                'netflix', 'spotify', 'twitch', 'amazon', 'ebay',
                                'chrome', 'firefox', 'edge', 'opera', 'brave'
                            ]
                            
                            for keyword in distracting_keywords:
                                if keyword in window_title or keyword in class_name:
                                    try:
                                        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
                                        self.blocked_count += 1
                                        print(f"🪟 CLOSED WINDOW: {window_title[:50]}...")
                                    except:
                                        pass
                    
                    win32gui.EnumWindows(enum_windows_callback, [])
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"Window monitor error: {e}")
                    continue
        
        thread = threading.Thread(target=window_monitor, daemon=True)
        thread.start()
        self.monitoring_threads.append(thread)
    
    def start_aggressive_terminator(self):
        """Aggressive termination using multiple methods"""
        def aggressive_terminator():
            print("⚡ Aggressive terminator started")
            while self.focus_active and datetime.now() < self.focus_end_time:
                try:
                    # Use tasklist and taskkill for additional coverage
                    for process_name in self.blocked_processes:
                        try:
                            # Kill by image name
                            result = subprocess.run(['taskkill', '/F', '/IM', process_name, '/T'], 
                                                  capture_output=True, text=True)
                            if result.returncode == 0:
                                self.blocked_count += 1
                                print(f"⚡ TASKKILL: {process_name}")
                        except:
                            pass
                    
                    time.sleep(2)  # Check every 2 seconds
                    
                except Exception as e:
                    print(f"Aggressive terminator error: {e}")
                    continue
        
        thread = threading.Thread(target=aggressive_terminator, daemon=True)
        thread.start()
        self.monitoring_threads.append(thread)
    
    def ultra_kill_process(self, pid, process_name):
        """Kill process using multiple methods for maximum effectiveness"""
        success = False
        
        try:
            # Method 1: Win32 API
            process_handle = win32api.OpenProcess(
                win32con.PROCESS_TERMINATE | win32con.PROCESS_QUERY_INFORMATION,
                False, pid
            )
            win32api.TerminateProcess(process_handle, 1)
            win32api.CloseHandle(process_handle)
            success = True
        except:
            pass
        
        try:
            # Method 2: psutil
            process = psutil.Process(pid)
            process.terminate()
            process.wait(timeout=1)
            success = True
        except:
            pass
        
        try:
            # Method 3: taskkill by PID
            subprocess.run(['taskkill', '/F', '/PID', str(pid), '/T'], 
                         capture_output=True, check=False)
            success = True
        except:
            pass
        
        try:
            # Method 4: taskkill by name
            subprocess.run(['taskkill', '/F', '/IM', process_name, '/T'], 
                         capture_output=True, check=False)
            success = True
        except:
            pass
        
        return success
    
    def block_websites_via_hosts(self):
        """Block websites by modifying Windows hosts file"""
        try:
            hosts_path = r'C:\Windows\System32\drivers\etc\hosts'
            
            # Backup original hosts file
            with open(hosts_path, 'r') as f:
                self.original_hosts = f.read()
            
            # Add blocking entries
            blocked_entries = []
            for domain in self.blocked_domains:
                blocked_entries.append(f"127.0.0.1 {domain}")
                blocked_entries.append(f"127.0.0.1 www.{domain}")
            
            # Write new hosts file
            new_hosts = self.original_hosts + "\n# FlowGenix Blocking - START\n"
            new_hosts += "\n".join(blocked_entries)
            new_hosts += "\n# FlowGenix Blocking - END\n"
            
            with open(hosts_path, 'w') as f:
                f.write(new_hosts)
            
            # Flush DNS cache
            subprocess.run(['ipconfig', '/flushdns'], capture_output=True)
            
            print(f"🌐 BLOCKED {len(self.blocked_domains)} domains via hosts file")
            
        except Exception as e:
            print(f"⚠️ Could not modify hosts file: {e}")
            print("🔧 Run as Administrator for full website blocking!")
    
    def restore_websites(self):
        """Restore original hosts file"""
        try:
            if self.original_hosts:
                hosts_path = r'C:\Windows\System32\drivers\etc\hosts'
                with open(hosts_path, 'w') as f:
                    f.write(self.original_hosts)
                
                # Flush DNS cache
                subprocess.run(['ipconfig', '/flushdns'], capture_output=True)
                print("🌐 Websites restored")
        except Exception as e:
            print(f"⚠️ Could not restore hosts file: {e}")
    
    def get_status(self):
        """Get blocking status"""
        if self.focus_active and self.focus_end_time:
            remaining = self.focus_end_time - datetime.now()
            if remaining.total_seconds() > 0:
                return {
                    'active': True,
                    'remaining_seconds': int(remaining.total_seconds()),
                    'blocked_count': self.blocked_count,
                    'blocked_processes': len(self.blocked_processes),
                    'blocked_domains': len(self.blocked_domains),
                    'end_time': self.focus_end_time.isoformat()
                }
            else:
                self.focus_active = False
        
        return {
            'active': False,
            'final_blocked_count': self.blocked_count
        }

class UltraBlockerRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/status':
            self.send_json_response(ultra_blocker_service.get_status())
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
                response = ultra_blocker_service.start_comprehensive_blocking(duration)
                self.send_json_response(response)
            
            elif self.path == '/stop':
                response = ultra_blocker_service.stop_comprehensive_blocking()
                self.send_json_response(response)
            
            else:
                self.send_json_response({'error': 'Not found'}, 404)
        
        except Exception as e:
            self.send_json_response({'error': str(e)}, 500)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Minimal logging"""
        pass

def check_admin_rights():
    """Check if running as administrator"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def main():
    global ultra_blocker_service
    
    print("🔥" * 20)
    print("🛡️ FLOWGENIX ULTRA COMPREHENSIVE BLOCKER")
    print("🔥" * 20)
    print("💥 MAXIMUM POWER - BLOCKS EVERYTHING!")
    print("🚫 ALL browsers, apps, games, social media, entertainment")
    print("🌐 Modifies system hosts file to block websites")
    print("⚡ Multiple blocking methods running simultaneously")
    
    if not check_admin_rights():
        print("\n⚠️  WARNING: Not running as Administrator!")
        print("🔧 For MAXIMUM blocking power (including websites),")
        print("🔧 restart as Administrator!")
        print("📱 App blocking will still work without admin rights.\n")
    else:
        print("\n✅ Running as Administrator - FULL POWER ACTIVATED!")
        print("🌐 Website blocking via hosts file: ENABLED")
        print("🚫 Maximum blocking effectiveness: ENABLED\n")
    
    try:
        ultra_blocker_service = UltraComprehensiveBlocker()
        
        port = 8888
        httpd = HTTPServer(('localhost', port), UltraBlockerRequestHandler)
        
        print(f"🌐 Ultra blocker service running on http://localhost:{port}")
        print(f"🔥 Ready to ULTRA BLOCK {len(ultra_blocker_service.blocked_processes)} app types!")
        print(f"🌐 Ready to ULTRA BLOCK {len(ultra_blocker_service.blocked_domains)} website domains!")
        print("\n" + "="*70)
        print("🎯 ULTRA BLOCKING FEATURES:")
        print("  🔥 Process termination every 0.5 seconds")
        print("  🪟 Window monitoring and closing")  
        print("  ⚡ Multiple kill methods per process")
        print("  🌐 System hosts file modification")
        print("  🚫 DNS cache flushing")
        print("  📱 Background monitoring threads")
        print("="*70)
        print("\n🚀 Start a focus session in FlowGenix web app to activate!")
        print("Press Ctrl+C to stop the service\n")
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        if ultra_blocker_service:
            ultra_blocker_service.restore_websites()
        print("\n👋 Ultra Blocker Service stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
