"""
FlowGenix App Blocker - Real Windows App Blocking using Win32 APIs
Blocks specified applications during focus sessions
"""

import win32api
import win32con
import win32process
import win32gui
import win32event
import win32security
import psutil
import time
import json
import threading
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import ttk, messagebox
import webbrowser
import os

class FlowGenixAppBlocker:
    def __init__(self):
        self.blocked_apps = [
            # Social Media Apps
            'chrome.exe', 'firefox.exe',   # Browsers (can be configured to block specific sites)
            'Discord.exe', 'WhatsApp.exe', 'Telegram.exe',
            
            # Gaming Apps
            'Steam.exe', 'EpicGamesLauncher.exe', 'RiotClientServices.exe',
            'League of Legends.exe', 'Valorant.exe', 'Minecraft.exe',
            
            # Entertainment Apps
            'Spotify.exe', 'Netflix.exe', 'VLC.exe', 'PotPlayer.exe',
            'YouTube.exe', 'TikTok.exe',
            
            # Shopping Apps
            'Amazon.exe', 'eBay.exe'
        ]
        
        # Essential apps that should NEVER be blocked
        self.essential_apps = [
            'explorer.exe', 'winlogon.exe', 'csrss.exe', 'wininit.exe',
            'services.exe', 'lsass.exe', 'svchost.exe', 'dwm.exe',
            'python.exe', 'pythonw.exe',  # Don't block ourselves!
        ]
        
        self.focus_active = False
        self.focus_end_time = None
        self.monitoring_thread = None
        self.blocked_processes = []
        
        # Create GUI
        self.setup_gui()
        
    def setup_gui(self):
        """Create the FlowGenix App Blocker GUI"""
        self.root = tk.Tk()
        self.root.title("FlowGenix App Blocker 🛡️")
        self.root.geometry("600x700")
        self.root.configure(bg='#2D1B69')  # K-Pop theme color
        
        # Title
        title_label = tk.Label(
            self.root, 
            text="🛡️ FlowGenix App Blocker", 
            font=('Arial', 20, 'bold'),
            bg='#2D1B69',
            fg='white'
        )
        title_label.pack(pady=20)
        
        # Status Frame
        status_frame = tk.Frame(self.root, bg='#2D1B69')
        status_frame.pack(pady=10)
        
        self.status_label = tk.Label(
            status_frame,
            text="🟢 Ready to Focus",
            font=('Arial', 14),
            bg='#2D1B69',
            fg='#06D6A0'
        )
        self.status_label.pack()
        
        # Timer Frame
        timer_frame = tk.Frame(self.root, bg='#2D1B69')
        timer_frame.pack(pady=20)
        
        tk.Label(
            timer_frame,
            text="Focus Duration (minutes):",
            font=('Arial', 12),
            bg='#2D1B69',
            fg='white'
        ).pack()
        
        self.duration_var = tk.StringVar(value="25")
        duration_combo = ttk.Combobox(
            timer_frame,
            textvariable=self.duration_var,
            values=["5", "15", "25", "45", "60"],
            state="readonly",
            width=10
        )
        duration_combo.pack(pady=10)
        
        # Control Buttons
        button_frame = tk.Frame(self.root, bg='#2D1B69')
        button_frame.pack(pady=20)
        
        self.start_button = tk.Button(
            button_frame,
            text="🚀 Start Focus Mode",
            command=self.start_focus_mode,
            font=('Arial', 12, 'bold'),
            bg='#FF6B9D',
            fg='white',
            relief='flat',
            padx=20,
            pady=10
        )
        self.start_button.pack(side=tk.LEFT, padx=10)
        
        self.stop_button = tk.Button(
            button_frame,
            text="⏹️ Stop Focus",
            command=self.stop_focus_mode,
            font=('Arial', 12, 'bold'),
            bg='#FF5722',
            fg='white',
            relief='flat',
            padx=20,
            pady=10,
            state='disabled'
        )
        self.stop_button.pack(side=tk.LEFT, padx=10)
        
        # Blocked Apps List
        list_frame = tk.Frame(self.root, bg='#2D1B69')
        list_frame.pack(pady=20, padx=20, fill='both', expand=True)
        
        tk.Label(
            list_frame,
            text="🚫 Apps to Block During Focus:",
            font=('Arial', 12, 'bold'),
            bg='#2D1B69',
            fg='white'
        ).pack(anchor='w')
        
        # Scrollable listbox
        listbox_frame = tk.Frame(list_frame)
        listbox_frame.pack(fill='both', expand=True, pady=10)
        
        scrollbar = tk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.app_listbox = tk.Listbox(
            listbox_frame,
            yscrollcommand=scrollbar.set,
            font=('Arial', 10),
            height=10
        )
        self.app_listbox.pack(side=tk.LEFT, fill='both', expand=True)
        scrollbar.config(command=self.app_listbox.yview)
        
        # Populate listbox
        for app in self.blocked_apps:
            self.app_listbox.insert(tk.END, f"🚫 {app}")
            
        # Add/Remove buttons
        modify_frame = tk.Frame(list_frame, bg='#2D1B69')
        modify_frame.pack(pady=10)
        
        self.app_entry = tk.Entry(modify_frame, width=30)
        self.app_entry.pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            modify_frame,
            text="➕ Add App",
            command=self.add_app,
            bg='#06D6A0',
            fg='white',
            relief='flat'
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            modify_frame,
            text="➖ Remove App",
            command=self.remove_app,
            bg='#FF5722',
            fg='white',
            relief='flat'
        ).pack(side=tk.LEFT, padx=5)
        
        # Web App Integration Button
        web_button = tk.Button(
            self.root,
            text="🌐 Open FlowGenix Web App",
            command=self.open_web_app,
            font=('Arial', 12, 'bold'),
            bg='#A855F7',
            fg='white',
            relief='flat',
            padx=20,
            pady=10
        )
        web_button.pack(pady=20)
        
        # Status updates
        self.root.after(1000, self.update_status)
        
    def open_web_app(self):
        """Open the FlowGenix web app"""
        web_app_path = os.path.join(os.path.dirname(__file__), 'flowgenix-colorful.html')
        webbrowser.open(f'file://{web_app_path}')
        
    def add_app(self):
        """Add a new app to block list"""
        app_name = self.app_entry.get().strip()
        if app_name and app_name not in self.blocked_apps:
            if not app_name.endswith('.exe'):
                app_name += '.exe'
            self.blocked_apps.append(app_name)
            self.app_listbox.insert(tk.END, f"🚫 {app_name}")
            self.app_entry.delete(0, tk.END)
            self.save_config()
            
    def remove_app(self):
        """Remove selected app from block list"""
        selection = self.app_listbox.curselection()
        if selection:
            index = selection[0]
            app_name = self.blocked_apps[index]
            self.blocked_apps.remove(app_name)
            self.app_listbox.delete(index)
            self.save_config()
            
    def save_config(self):
        """Save configuration to file"""
        config = {
            'blocked_apps': self.blocked_apps,
            'last_updated': datetime.now().isoformat()
        }
        with open('flowgenix_config.json', 'w') as f:
            json.dump(config, f, indent=2)
            
    def load_config(self):
        """Load configuration from file"""
        try:
            with open('flowgenix_config.json', 'r') as f:
                config = json.load(f)
                self.blocked_apps = config.get('blocked_apps', self.blocked_apps)
        except FileNotFoundError:
            pass
            
    def start_focus_mode(self):
        """Start focus mode with app blocking"""
        try:
            duration = int(self.duration_var.get())
            self.focus_end_time = datetime.now() + timedelta(minutes=duration)
            self.focus_active = True
            
            # Start monitoring thread
            self.monitoring_thread = threading.Thread(target=self.monitor_apps, daemon=True)
            self.monitoring_thread.start()
            
            # Update UI
            self.start_button.config(state='disabled')
            self.stop_button.config(state='normal')
            
            messagebox.showinfo(
                "Focus Mode Started! 🚀",
                f"App blocking is now active for {duration} minutes!\n\n"
                f"Blocked apps will be automatically closed.\n"
                f"Essential apps remain accessible.\n\n"
                f"Stay focused! 💪"
            )
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to start focus mode: {str(e)}")
            
    def stop_focus_mode(self):
        """Stop focus mode"""
        self.focus_active = False
        self.focus_end_time = None
        
        # Update UI
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        
        messagebox.showinfo(
            "Focus Complete! 🎉",
            "Focus mode has been stopped.\n\n"
            "Great work on staying focused! 👏"
        )
        
    def monitor_apps(self):
        """Monitor and block specified applications"""
        while self.focus_active and datetime.now() < self.focus_end_time:
            try:
                # Get all running processes
                for process in psutil.process_iter(['pid', 'name', 'exe']):
                    try:
                        process_name = process.info['name']
                        
                        # Check if this process should be blocked
                        if (process_name.lower() in [app.lower() for app in self.blocked_apps] and 
                            process_name.lower() not in [app.lower() for app in self.essential_apps]):
                            
                            # Attempt to terminate the process
                            self.terminate_process(process.info['pid'], process_name)
                            
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
                        
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                print(f"Monitoring error: {e}")
                continue
                
        # Focus session ended
        if self.focus_active:
            self.focus_active = False
            self.root.after(0, self.focus_session_complete)
            
    def terminate_process(self, pid, process_name):
        """Terminate a specific process using Win32 API"""
        try:
            # Open process handle
            process_handle = win32api.OpenProcess(
                win32con.PROCESS_TERMINATE | win32con.PROCESS_QUERY_INFORMATION,
                False,
                pid
            )
            
            # Show warning window to user
            self.show_block_warning(process_name)
            
            # Terminate the process
            win32api.TerminateProcess(process_handle, 1)
            win32api.CloseHandle(process_handle)
            
            print(f"🚫 Blocked and terminated: {process_name} (PID: {pid})")
            
        except Exception as e:
            print(f"Failed to terminate {process_name}: {e}")
            
    def show_block_warning(self, app_name):
        """Show a warning popup when an app is blocked"""
        def show_warning():
            warning_window = tk.Toplevel(self.root)
            warning_window.title("App Blocked! 🚫")
            warning_window.geometry("400x300")
            warning_window.configure(bg='#FF5722')
            warning_window.attributes('-topmost', True)
            
            tk.Label(
                warning_window,
                text="🚫",
                font=('Arial', 48),
                bg='#FF5722',
                fg='white'
            ).pack(pady=20)
            
            tk.Label(
                warning_window,
                text="App Blocked During Focus!",
                font=('Arial', 16, 'bold'),
                bg='#FF5722',
                fg='white'
            ).pack()
            
            tk.Label(
                warning_window,
                text=f"{app_name} was blocked",
                font=('Arial', 12),
                bg='#FF5722',
                fg='white'
            ).pack(pady=10)
            
            tk.Label(
                warning_window,
                text="Stay focused! 💪\nYou can do this! 🌟",
                font=('Arial', 12),
                bg='#FF5722',
                fg='white',
                justify='center'
            ).pack(pady=20)
            
            tk.Button(
                warning_window,
                text="✅ Got it!",
                command=warning_window.destroy,
                font=('Arial', 12, 'bold'),
                bg='white',
                fg='#FF5722',
                relief='flat',
                padx=20,
                pady=5
            ).pack(pady=20)
            
            # Auto close after 3 seconds
            warning_window.after(3000, warning_window.destroy)
            
        # Run in main thread
        self.root.after(0, show_warning)
        
    def focus_session_complete(self):
        """Called when focus session is complete"""
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        
        messagebox.showinfo(
            "🎉 Focus Session Complete!",
            "Congratulations! 🎊\n\n"
            "You've successfully completed your focus session!\n"
            "Apps are now unblocked.\n\n"
            "Keep up the great work! 💪⭐"
        )
        
    def update_status(self):
        """Update status label"""
        if self.focus_active and self.focus_end_time:
            remaining = self.focus_end_time - datetime.now()
            if remaining.total_seconds() > 0:
                minutes = int(remaining.total_seconds() // 60)
                seconds = int(remaining.total_seconds() % 60)
                self.status_label.config(
                    text=f"🔥 Focus Active: {minutes:02d}:{seconds:02d}",
                    fg='#FF6B9D'
                )
            else:
                self.status_label.config(
                    text="🟢 Ready to Focus",
                    fg='#06D6A0'
                )
        else:
            self.status_label.config(
                text="🟢 Ready to Focus",
                fg='#06D6A0'
            )
            
        self.root.after(1000, self.update_status)
        
    def run(self):
        """Start the application"""
        self.load_config()
        
        # Check for admin privileges
        try:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin()
            if not is_admin:
                messagebox.showwarning(
                    "Administrator Required ⚠️",
                    "For best results, run this application as Administrator.\n\n"
                    "This allows more reliable app blocking functionality."
                )
        except:
            pass
            
        self.root.mainloop()

if __name__ == "__main__":
    print("🛡️ Starting FlowGenix App Blocker...")
    print("Real Windows app blocking using Win32 APIs")
    
    try:
        app = FlowGenixAppBlocker()
        app.run()
    except KeyboardInterrupt:
        print("\n👋 FlowGenix App Blocker stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")
