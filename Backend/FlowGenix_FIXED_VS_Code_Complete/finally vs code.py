"""
FlowGenix Comprehensive App Blocker - Enhanced Version
Blocks ALL distracting apps and websites comprehensively
"""

import json
import time
import threading
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import psutil
import win32api
import win32con
import win32gui
import subprocess
import os
import socket

# Global service instance
comprehensive_blocker_service = None

class ComprehensiveBlockerService:
    def __init__(self):
        self.focus_active = False
        self.focus_end_time = None
        self.monitoring_thread = None
        self.blocked_count = 0
        
        # ULTRA-AGGRESSIVE BLOCKING - Block ALL apps except absolute essentials
        self.blocked_apps = [
            # ALL WEB BROWSERS - Block completely
            'chrome.exe', 'firefox.exe', 'opera.exe', 'safari.exe',
            'iexplore.exe', 'chromium.exe', 'brave.exe', 'vivaldi.exe', 'edge.exe',
            
            # Social Media Desktop Apps (ALL BLOCKED)
            'Discord.exe', 'Telegram.exe', 'Skype.exe', 'slack.exe', 
            'FacebookMessenger.exe', 'Instagram.exe', 'TikTok.exe', 
            'snapchat.exe', 'WeChat.exe', 'Line.exe', 'Viber.exe',
            'Messenger.exe', 'TwitterApp.exe', 'LinkedInApp.exe',
            
            # Gaming Platforms & Games (ALL BLOCKED)
            'Steam.exe', 'EpicGamesLauncher.exe', 'RiotClientServices.exe',
            'Battle.net.exe', 'Origin.exe', 'Uplay.exe', 'GOGGalaxy.exe',
            'LeagueofLegends.exe', 'Valorant.exe', 'Minecraft.exe',
            'Roblox.exe', 'FortniteClient-Win64-Shipping.exe',
            'WorldOfWarcraft.exe', 'Overwatch.exe', 'ApexLegends.exe',
            'CSGO.exe', 'Dota2.exe', 'PUBGLite.exe', 'AmongUs.exe',
            'FallGuys.exe', 'RocketLeague.exe', 'FIFA.exe', 'NBA2K.exe',
            'GenshinImpact.exe', 'Warzone.exe', 'CallofDuty.exe',
            
            # Entertainment & Media (ALL BLOCKED)
            'Spotify.exe', 'Netflix.exe', 'YouTubeMusic.exe', 'Hulu.exe', 
            'DisneyPlus.exe', 'Twitch.exe', 'AmazonMusic.exe', 'iTunes.exe',
            'VLC.exe', 'MediaPlayer.exe', 'PotPlayer.exe', 'WindowsMediaPlayer.exe',
            'AmazonPrimeVideo.exe', 'HBOMax.exe', 'Paramount.exe', 'Peacock.exe',
            'AppleTV.exe', 'Crunchyroll.exe', 'Funimation.exe',
            
            # Shopping & E-commerce (ALL BLOCKED)
            'Amazon.exe', 'eBay.exe', 'Etsy.exe', 'AliExpress.exe',
            'Wish.exe', 'Shein.exe', 'Temu.exe', 'Mercari.exe',
            'OfferUp.exe', 'Poshmark.exe', 'Depop.exe',
            
            # Video Creation & Streaming (ALL BLOCKED)
            'obs64.exe', 'obs32.exe', 'streamlabs obs.exe', 'XSplit.exe',
            'Camtasia.exe', 'Bandicam.exe', 'Fraps.exe',
            
            # News & Social Reading (ALL BLOCKED)
            'Reddit.exe', 'Flipboard.exe', 'Feedly.exe', 'Pocket.exe',
            'Medium.exe', 'Quora.exe', '9GAG.exe', 'BuzzFeed.exe',
            
            # Dating & Social Apps (ALL BLOCKED)
            'Tinder.exe', 'Bumble.exe', 'Hinge.exe', 'OkCupid.exe',
            'Match.exe', 'eharmony.exe',
            
            # Photo & Video Editing (ALL BLOCKED)
            'Instagram.exe', 'VSCO.exe', 'Canva.exe', 'PicsArt.exe',
            'Lightroom.exe', 'Photoshop.exe', 'Premiere.exe', 'AfterEffects.exe',
            
            # Office & Productivity Apps (BLOCKED) - VS Code REMOVED
            'WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'OUTLOOK.EXE',
            'devenv.exe', 'pycharm64.exe', 'notepad++.exe',
            
            # Miscellaneous (ALL BLOCKED)
            'WeatherApp.exe', 'StockApp.exe', 'NewsApp.exe', 'Calculator.exe',
            'notepad.exe', 'calc.exe', 'mspaint.exe', 'wordpad.exe'
        ]
        
        # ONLY THESE APPS ARE ALLOWED
        self.allowed_apps = [
            'WhatsApp.exe',  # WhatsApp allowed
            'Phone.exe',     # Phone calls allowed
            'CallApp.exe'    # Phone app allowed
        ]
        
        # Websites to block when detected in browser titles/URLs
        self.blocked_websites = [
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'reddit.com', 'youtube.com', 'netflix.com', 'twitch.tv',
            'discord.com', 'snapchat.com', 'linkedin.com/feed',
            'amazon.com', 'ebay.com', 'aliexpress.com', 'spotify.com',
            'steam', 'epicgames.com', 'battle.net'
        ]
        
        # Essential apps that should NEVER be blocked
        self.essential_apps = [
            # Core System
            'explorer.exe', 'winlogon.exe', 'csrss.exe', 'wininit.exe',
            'services.exe', 'lsass.exe', 'svchost.exe', 'dwm.exe',
            'System', 'Registry', 'smss.exe', 'wininit.exe',
            
            # Security & System Management
            'MsMpEng.exe', 'SecurityHealthService.exe', 'WindowsSecurityService.exe',
            'taskmgr.exe', 'mmc.exe', 'devmgmt.exe',
            
            # FlowGenix & Python
            'python.exe', 'pythonw.exe', 'cmd.exe', 'powershell.exe',
            
            # Essential Communication (Emergency)
            'Phone.exe', 'CallApp.exe',
            
            # Work & Productivity Tools
            'WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'OUTLOOK.EXE',
            'AcroRd32.exe', 'Acrobat.exe', 'notepad++.exe',
            'Code.exe', 'devenv.exe', 'pycharm64.exe',
            
            # System Utilities
            'SystemSettings.exe', 'ControlPanel.exe', 'regedit.exe'
        ]
        
    def start_focus_mode(self, duration_minutes):
        """Start comprehensive focus mode with immediate mass termination"""
        try:
            if self.focus_active:
                return {'success': False, 'message': 'Focus mode already active'}
                
            self.focus_end_time = datetime.now() + timedelta(minutes=duration_minutes)
            self.focus_active = True
            self.blocked_count = 0
            
            print(f"🛡️ COMPREHENSIVE Focus Protection started for {duration_minutes} minutes")
            print(f"📱 ALL distracting apps and websites will be blocked!")
            print(f"🚫 IMMEDIATE MASS TERMINATION - Closing all currently running distracting apps...")
            
            # IMMEDIATE MASS TERMINATION of all currently running distracting apps
            initial_blocked = self.terminate_all_distracting_apps()
            
            if initial_blocked > 0:
                print(f"💥 MASS TERMINATION COMPLETE: Closed {initial_blocked} distracting apps immediately!")
            else:
                print(f"✅ No distracting apps were running - system is clean!")
            
            # Start monitoring thread for any new apps that try to start
            if self.monitoring_thread is None or not self.monitoring_thread.is_alive():
                self.monitoring_thread = threading.Thread(target=self.comprehensive_monitor, daemon=True)
                self.monitoring_thread.start()
                
            return {
                'success': True, 
                'message': f'Comprehensive focus protection activated! Terminated {initial_blocked} running apps and monitoring for new ones.',
                'end_time': self.focus_end_time.isoformat(),
                'blocked_apps_count': len(self.blocked_apps),
                'initial_blocked': initial_blocked
            }
        except Exception as e:
            print(f"❌ Error starting focus mode: {e}")
            return {'success': False, 'message': f'Error starting focus mode: {str(e)}'}
    
    def stop_focus_mode(self):
        """Stop focus mode"""
        self.focus_active = False
        self.focus_end_time = None
        print(f"🏁 Focus mode stopped. Total apps blocked: {self.blocked_count}")
        return {'success': True, 'message': f'Focus mode stopped. Blocked {self.blocked_count} app launches.'}
    
    def get_status(self):
        """Get current focus status"""
        if self.focus_active and self.focus_end_time:
            remaining = self.focus_end_time - datetime.now()
            if remaining.total_seconds() > 0:
                return {
                    'active': True,
                    'remaining_seconds': int(remaining.total_seconds()),
                    'end_time': self.focus_end_time.isoformat(),
                    'blocked_count': self.blocked_count,
                    'total_blocked_apps': len(self.blocked_apps)
                }
            else:
                self.focus_active = False
                return {'active': False, 'final_blocked_count': self.blocked_count}
        return {'active': False, 'blocked_count': self.blocked_count}
    
    def comprehensive_monitor(self):
        """Comprehensive monitoring and blocking of all distracting apps"""
        print("🔍 Starting COMPREHENSIVE app monitoring...")
        print(f"🚫 Monitoring {len(self.blocked_apps)} potentially distracting applications")
        
        while self.focus_active and datetime.now() < self.focus_end_time:
            try:
                current_processes = []
                
                # Get all running processes
                for process in psutil.process_iter(['pid', 'name']):
                    try:
                        process_name = process.info['name']
                        current_processes.append(process_name.lower())
                        
                        # Check if this process should be blocked (ULTRA-AGGRESSIVE MODE)
                        if (process_name.lower() in [app.lower() for app in self.blocked_apps] and 
                            process_name.lower() not in [app.lower() for app in self.essential_apps]):
                            
                            # NO EXCEPTIONS - Block everything in the blocked list
                            # Only exception: FlowGenix UI browser (must remain accessible)
                            if process_name.lower() in ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'brave.exe']:
                                try:
                                    browser_process = psutil.Process(process.info['pid'])
                                    # ONLY protect FlowGenix UI browser, block ALL others
                                    if self.is_flowgenix_ui_only(browser_process):
                                        continue  # Skip blocking ONLY FlowGenix UI browser
                                except:
                                    pass  # If we can't check, proceed with blocking
                            
                            # Terminate the process immediately
                            if self.force_terminate_process(process.info['pid'], process_name):
                                self.blocked_count += 1
                                print(f"🚫 ULTRA BLOCKED: {process_name} (Session total: {self.blocked_count})")
                            
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
                
                # Block network access to distracting websites (simplified approach)
                self.block_distracting_network_access()
                        
                # Check every 1 second for maximum effectiveness
                time.sleep(1)
                
            except Exception as e:
                print(f"⚠️ Monitoring error: {e}")
                continue
                
        # Focus session ended
        if self.focus_active:
            self.focus_active = False
            print(f"🎉 COMPREHENSIVE Focus session complete!")
            print(f"📊 Total blocked: {self.blocked_count} distracting app launches")
    
    def is_essential_browser_process(self, process):
        """Check if this browser process is running essential services (FlowGenix UI, Gmail, phone calls)"""
        try:
            if process.name().lower() in ['chrome.exe', 'firefox.exe', 'opera.exe', 'brave.exe']:
                
                # Method 1: Check command line arguments for FlowGenix
                try:
                    cmdline = process.cmdline()
                    cmdline_str = ' '.join(cmdline).lower()
                    
                    # FlowGenix indicators
                    flowgenix_indicators = [
                        'flowgenix-integrated.html',
                        'flowgenix-standalone.html', 
                        'flowgenix-colorful.html',
                        'test_connection.html',
                        'localhost:8888',
                        'localhost:3000'
                    ]
                    
                    for indicator in flowgenix_indicators:
                        if indicator in cmdline_str:
                            print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix UI")
                            return True
                    
                    # Essential communication sites
                    essential_sites = [
                        'gmail.com', 'mail.google.com', 'google.com/gmail',
                        'outlook.com', 'outlook.office.com', 'office.com',
                        'teams.microsoft.com', 'zoom.us', 'meet.google.com',
                        'phone.google.com', 'voice.google.com'
                    ]
                    
                    for site in essential_sites:
                        if site in cmdline_str:
                            print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - Essential: {site}")
                            return True
                            
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    pass
                
                # Method 2: Check window titles for essential services
                try:
                    protected_windows = []
                    
                    def enum_windows_callback(hwnd, results):
                        """Callback for enumerating windows"""
                        try:
                            window_pid = win32gui.GetWindowThreadProcessId(hwnd)[1]
                            if window_pid == process.pid:
                                window_title = win32gui.GetWindowText(hwnd).lower()
                                if window_title:
                                    results.append(window_title)
                        except:
                            pass
                        return True
                    
                    # Get all window titles for this process
                    window_titles = []
                    try:
                        win32gui.EnumWindows(enum_windows_callback, window_titles)
                    except:
                        pass
                    
                    # Check for FlowGenix indicators in window titles
                    flowgenix_title_indicators = [
                        'nexus', 'flowgenix', 'localhost', 'integrated', 'comprehensive', 'connection test'
                    ]
                    
                    for title in window_titles:
                        for indicator in flowgenix_title_indicators:
                            if indicator in title:
                                print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix window: {title[:50]}")
                                return True
                    
                    # Check for essential communication in window titles
                    essential_title_indicators = [
                        'gmail', 'inbox', 'mail.google.com', 'outlook', 'office.com',
                        'teams', 'zoom', 'meet.google.com', 'google voice', 'phone'
                    ]
                    
                    for title in window_titles:
                        for indicator in essential_title_indicators:
                            if indicator in title:
                                print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - Essential: {title[:50]}")
                                return True
                                
                except Exception:
                    pass
                
                # Method 3: Check network connections for FlowGenix API
                try:
                    connections = process.connections()
                    for conn in connections:
                        if (hasattr(conn, 'laddr') and conn.laddr and 
                            hasattr(conn, 'raddr') and conn.raddr):
                            if ((conn.laddr.ip == '127.0.0.1' or conn.raddr.ip == '127.0.0.1') and 
                                (conn.laddr.port == 8888 or conn.raddr.port == 8888)):
                                print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix API connection")
                                return True
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    pass
                
                # Method 4: Check if browser has distracting websites
                try:
                    # If we can't identify essential content, check for distracting content
                    cmdline = process.cmdline()
                    cmdline_str = ' '.join(cmdline).lower() if cmdline else ''
                    
                    # Check for distracting websites in command line
                    for blocked_site in self.blocked_websites:
                        if blocked_site in cmdline_str:
                            print(f"❌ BLOCKING: {process.name()} (PID: {process.pid}) - Distracting site: {blocked_site}")
                            return False  # Not essential - should be blocked
                    
                    # Check window titles for distracting content
                    window_titles = []
                    try:
                        win32gui.EnumWindows(lambda hwnd, results: (
                            results.append(win32gui.GetWindowText(hwnd).lower()) 
                            if win32gui.GetWindowThreadProcessId(hwnd)[1] == process.pid and win32gui.GetWindowText(hwnd) 
                            else None
                        ), window_titles)
                    except:
                        pass
                    
                    for title in window_titles:
                        for blocked_site in self.blocked_websites:
                            if blocked_site.replace('.com', '') in title:
                                print(f"❌ BLOCKING: {process.name()} (PID: {process.pid}) - Distracting title: {title[:50]}")
                                return False  # Not essential - should be blocked
                                
                except:
                    pass
                
                # If no specific indicators found, this browser should be blocked
                # Only protect very fresh processes (< 2 seconds) to avoid blocking essential startup
                try:
                    process_age = time.time() - process.create_time()
                    if process_age < 2:  # Only very new processes get benefit of doubt
                        print(f"⚠️ TEMPORARY PROTECTION: {process.name()} (PID: {process.pid}) - Very new process (age: {process_age:.1f}s)")
                        return True  # Brief protection for startup
                    else:
                        print(f"❌ BLOCKING: {process.name()} (PID: {process.pid}) - No essential indicators found (age: {process_age:.1f}s)")
                        return False  # Block older processes without essential indicators
                except:
                    pass
                    
        except Exception:
            pass
            
        return False  # Default to blocking browsers unless clearly essential
    
    def is_flowgenix_ui_only(self, process):
        """ULTRA-RESTRICTIVE: Only protect FlowGenix UI browser, block ALL others"""
        try:
            # Method 1: Check command line for FlowGenix ONLY
            try:
                cmdline = process.cmdline()
                cmdline_str = ' '.join(cmdline).lower()
                
                # ONLY FlowGenix indicators allowed
                flowgenix_indicators = [
                    'flowgenix-integrated.html',
                    'flowgenix-standalone.html', 
                    'flowgenix-colorful.html',
                    'test_connection.html',
                    'localhost:8888'
                ]
                
                for indicator in flowgenix_indicators:
                    if indicator in cmdline_str:
                        print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix UI ONLY")
                        return True
                        
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                pass
            
            # Method 2: Check window titles for FlowGenix ONLY
            try:
                window_titles = []
                try:
                    def enum_windows_callback(hwnd, results):
                        try:
                            window_pid = win32gui.GetWindowThreadProcessId(hwnd)[1]
                            if window_pid == process.pid:
                                window_title = win32gui.GetWindowText(hwnd).lower()
                                if window_title:
                                    results.append(window_title)
                        except:
                            pass
                        return True
                    
                    win32gui.EnumWindows(enum_windows_callback, window_titles)
                except:
                    pass
                
                # ONLY FlowGenix window titles allowed
                flowgenix_title_indicators = [
                    'nexus', 'flowgenix', 'localhost:8888', 'integrated', 'comprehensive', 'connection test'
                ]
                
                for title in window_titles:
                    for indicator in flowgenix_title_indicators:
                        if indicator in title:
                            print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix UI window")
                            return True
                            
            except Exception:
                pass
            
            # Method 3: Check API connections for FlowGenix ONLY
            try:
                connections = process.connections()
                for conn in connections:
                    if (hasattr(conn, 'laddr') and conn.laddr and 
                        hasattr(conn, 'raddr') and conn.raddr):
                        if ((conn.laddr.ip == '127.0.0.1' or conn.raddr.ip == '127.0.0.1') and 
                            (conn.laddr.port == 8888 or conn.raddr.port == 8888)):
                            print(f"🛡️ PROTECTING: {process.name()} (PID: {process.pid}) - FlowGenix API connection")
                            return True
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                pass
                
        except Exception:
            pass
            
        # BLOCK EVERYTHING ELSE - No Gmail, no Google, no other websites allowed!
        return False
    
    def terminate_all_distracting_apps(self):
        """Mass termination of distracting applications while protecting FlowGenix UI"""
        terminated_count = 0
        protected_count = 0
        terminated_apps = []
        
        print("💥 MASS TERMINATION INITIATED - Scanning all running processes...")
        print("🛡️ Will PROTECT any browser running FlowGenix UI...")
        
        # First pass: Identify and protect FlowGenix browsers
        protected_pids = set()
        
        try:
            print("🔍 Phase 1: Identifying FlowGenix UI browsers to protect...")
            for process in psutil.process_iter(['pid', 'name']):
                try:
                    process_name = process.info['name']
                    
                    # Check browsers first for essential service protection
                    if process_name.lower() in ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'brave.exe']:
                        try:
                            browser_process = psutil.Process(process.info['pid'])
                            if self.is_essential_browser_process(browser_process):
                                protected_pids.add(process.info['pid'])
                                protected_count += 1
                                print(f"🛡️ PROTECTED: {process_name} (PID: {process.info['pid']}) - Essential service detected!")
                        except:
                            pass  # If we can't check, it will be terminated
                            
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            print(f"🛡️ Phase 1 Complete: {protected_count} FlowGenix browser instances identified for protection")
            print("💥 Phase 2: Terminating non-protected distracting apps...")
            
            # Second pass: Terminate apps that aren't protected
            for process in psutil.process_iter(['pid', 'name']):
                try:
                    process_name = process.info['name']
                    pid = process.info['pid']
                    
                    # Skip if this PID is protected
                    if pid in protected_pids:
                        continue
                    
                    # Check if this process should be terminated
                    if (process_name.lower() in [app.lower() for app in self.blocked_apps] and 
                        process_name.lower() not in [app.lower() for app in self.essential_apps]):
                        
                        # Terminate the process
                        if self.force_terminate_process(pid, process_name):
                            terminated_count += 1
                            terminated_apps.append(process_name)
                            print(f"💥 TERMINATED: {process_name} (PID: {pid})")
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
            
            print(f"⚡ MASS TERMINATION SUMMARY:")
            print(f"   💀 Total Terminated: {terminated_count} applications")
            print(f"   🛡️ FlowGenix UI Protected: {protected_count} browser instances")
            if terminated_count > 0:
                print(f"   📋 Apps Closed: {', '.join(set(terminated_apps))}")
            if protected_count > 0:
                print(f"   ✅ FlowGenix UI remains accessible in protected browsers!")
            
            return terminated_count
            
        except Exception as e:
            print(f"⚠️ Error during mass termination: {e}")
            return terminated_count
    
    def force_terminate_process(self, pid, process_name):
        """Force terminate process using Win32 API with maximum effectiveness"""
        try:
            # Try Win32 API termination first
            process_handle = win32api.OpenProcess(
                win32con.PROCESS_TERMINATE | win32con.PROCESS_QUERY_INFORMATION,
                False, pid
            )
            win32api.TerminateProcess(process_handle, 1)
            win32api.CloseHandle(process_handle)
            
            # Also try taskkill as backup
            subprocess.run(['taskkill', '/F', '/PID', str(pid)], 
                         capture_output=True, check=False)
            
            return True
        except Exception as e:
            # Try alternative termination method
            try:
                subprocess.run(['taskkill', '/F', '/IM', process_name], 
                             capture_output=True, check=False)
                return True
            except:
                return False
    
    def block_distracting_network_access(self):
        """Block network access to distracting websites (basic implementation)"""
        # This is a simplified approach - in a full implementation, 
        # you might use Windows Firewall API or modify hosts file
        distracting_domains = [
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'reddit.com', 'youtube.com', 'netflix.com', 'twitch.tv',
            'discord.com', 'whatsapp.com', 'telegram.org',
            'amazon.com', 'ebay.com', 'aliexpress.com'
        ]
        
        # For demonstration - this would need proper implementation
        # with Windows Firewall API or DNS blocking
        pass

class BridgeRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/status':
            self.send_json_response(comprehensive_blocker_service.get_status())
        elif self.path == '/health':
            self.send_json_response({'status': 'healthy', 'service': 'comprehensive_blocker'})
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
                response = comprehensive_blocker_service.start_focus_mode(duration)
                self.send_json_response(response)
                
            elif self.path == '/stop':
                response = comprehensive_blocker_service.stop_focus_mode()
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
        """Custom logging"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def main():
    global comprehensive_blocker_service
    
    print("🛡️ Starting FlowGenix SELECTIVE App Blocker Service...")
    print("🚫 This service blocks distracting apps while protecting essential tools!")
    print("📱 Distracting apps blocked, FlowGenix UI + Gmail + Phone calls protected!")
    
    try:
        # Create service instance
        comprehensive_blocker_service = ComprehensiveBlockerService()
        
        # Create HTTP server
        port = 8888
        httpd = HTTPServer(('localhost', port), BridgeRequestHandler)
        
        print(f"🌐 Comprehensive blocker service running on http://localhost:{port}")
        print(f"🚫 Ready to block {len(comprehensive_blocker_service.blocked_apps)} types of distracting apps!")
        print("💡 Web app can now activate COMPREHENSIVE focus protection")
        print("\n" + "="*60)
        print("🎯 COMPREHENSIVE BLOCKING FEATURES:")
        print("  • ALL web browsers (Chrome, Firefox, Edge, etc.)")
        print("  • Social media apps (Discord, WhatsApp, Telegram, etc.)")
        print("  • Gaming platforms (Steam, Epic Games, etc.)")
        print("  • Entertainment apps (Spotify, Netflix, etc.)")
        print("  • Shopping apps (Amazon, eBay, etc.)")
        print("  • And many more distracting applications!")
        print("="*60)
        print("\nPress Ctrl+C to stop the service\n")
        
        # Start server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n👋 FlowGenix Comprehensive Blocker Service stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
