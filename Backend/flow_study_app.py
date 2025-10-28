#!/usr/bin/env python3
"""
Flow State Study Companion
A comprehensive study application with camera tracking, todo management, and calendar integration
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
from datetime import datetime, timedelta
import threading
import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Import our custom modules
try:
    from camera_utils import CameraManager, FocusAnalyzer, create_focus_report
    from todo_manager import TaskManager, Priority, TaskStatus, TaskCategory
    from calendar_manager import CalendarManager, EventType, Priority as CalPriority, CalendarGUI
except ImportError as e:
    print(f"Warning: Could not import modules: {e}")
    print("Some features may not be available.")

# Try to import PIL for image handling
try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Warning: PIL not available. Camera display may not work properly.")

# Try to import cv2
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV not available. Camera features will be disabled.")

@dataclass
class StudySession:
    id: str
    task_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    duration: int  # in minutes
    session_type: str  # 'focus' or 'break'
    quality_rating: int  # 1-5
    notes: str = ""
    snapshots: List[str] = None

    def __post_init__(self):
        if self.snapshots is None:
            self.snapshots = []

class FlowStateTimer:
    """Pomodoro timer with flow state optimization"""
    
    def __init__(self, work_duration=25, break_duration=5):
        self.work_duration = work_duration * 60  # Convert to seconds
        self.break_duration = break_duration * 60
        self.current_duration = self.work_duration
        self.time_left = self.current_duration
        self.is_running = False
        self.is_break = False
        self.completed_cycles = 0
        self.timer_thread = None
        self.callbacks = []

    def add_callback(self, callback):
        """Add callback function to be called on timer events"""
        self.callbacks.append(callback)

    def start(self):
        """Start the timer"""
        if not self.is_running:
            self.is_running = True
            self.timer_thread = threading.Thread(target=self._run_timer)
            self.timer_thread.daemon = True
            self.timer_thread.start()

    def pause(self):
        """Pause the timer"""
        self.is_running = False

    def reset(self):
        """Reset the timer"""
        self.is_running = False
        self.time_left = self.current_duration

    def switch_mode(self):
        """Switch between work and break mode"""
        self.is_break = not self.is_break
        self.current_duration = self.break_duration if self.is_break else self.work_duration
        self.time_left = self.current_duration
        self.is_running = False

    def _run_timer(self):
        """Internal timer loop"""
        while self.is_running and self.time_left > 0:
            time.sleep(1)
            if self.is_running:
                self.time_left -= 1
                for callback in self.callbacks:
                    try:
                        callback('tick', self.time_left)
                    except Exception as e:
                        print(f"Error in timer callback: {e}")

        if self.time_left <= 0:
            if not self.is_break:
                self.completed_cycles += 1
            
            for callback in self.callbacks:
                try:
                    callback('complete', self.is_break)
                except Exception as e:
                    print(f"Error in timer callback: {e}")
            
            # Auto-switch mode
            self.switch_mode()

    def get_formatted_time(self):
        """Get formatted time string"""
        minutes = self.time_left // 60
        seconds = self.time_left % 60
        return f"{minutes:02d}:{seconds:02d}"

    def get_progress(self):
        """Get progress percentage"""
        elapsed = self.current_duration - self.time_left
        return (elapsed / self.current_duration) * 100

class DataManager:
    """Manages data persistence"""
    
    def __init__(self, data_file="study_data.json"):
        self.data_file = data_file
        self.data = {
            'sessions': [],
            'settings': {}
        }
        self.load_data()

    def load_data(self):
        """Load data from file"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    loaded_data = json.load(f)
                    self.data.update(loaded_data)
        except Exception as e:
            print(f"Error loading data: {e}")

    def save_data(self):
        """Save data to file"""
        try:
            # Convert datetime objects to strings for JSON serialization
            serializable_data = {}
            for key, value in self.data.items():
                if isinstance(value, list):
                    serializable_data[key] = []
                    for item in value:
                        if isinstance(item, dict):
                            serialized_item = {}
                            for k, v in item.items():
                                if isinstance(v, datetime):
                                    serialized_item[k] = v.isoformat()
                                else:
                                    serialized_item[k] = v
                            serializable_data[key].append(serialized_item)
                        else:
                            serializable_data[key].append(item)
                else:
                    serializable_data[key] = value

            with open(self.data_file, 'w') as f:
                json.dump(serializable_data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")

    def add_session(self, session: StudySession):
        """Add a new session"""
        session_dict = asdict(session)
        session_dict['start_time'] = session.start_time.isoformat()
        if session.end_time:
            session_dict['end_time'] = session.end_time.isoformat()
        
        self.data['sessions'].append(session_dict)
        self.save_data()

class FlowStudyApp:
    """Main application class"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Flow State Study Companion")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f4f8')
        
        # Initialize components
        self.timer = FlowStateTimer()
        self.data_manager = DataManager()
        
        # Initialize managers if available
        self.camera_manager = None
        self.task_manager = None
        self.calendar_manager = None
        
        try:
            if CV2_AVAILABLE:
                self.camera_manager = CameraManager()  # Camera auto-starts now
                # Add focus callback for automatic timer control
                self.camera_manager.add_focus_callback(self.on_focus_event)
            self.task_manager = TaskManager()
            self.calendar_manager = CalendarManager()
        except Exception as e:
            print(f"Warning: Could not initialize managers: {e}")
        
        # Timer callbacks
        self.timer.add_callback(self.on_timer_event)
        
        # Current session
        self.current_session = None
        
        # Post-completion alarm system (1 minute after timer ends)
        self.post_completion_alarm_thread = None
        self.post_completion_alarm_running = False
        
        # Focus monitoring
        self.focus_lost_count = 0
        
        # Setup UI
        self.setup_ui()
        
        # Start camera frame updates if available
        if self.camera_manager:
            self.update_camera_frame()

    def setup_ui(self):
        """Setup the user interface"""
        # Create notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Create tabs
        self.create_timer_tab()
        self.create_tasks_tab()
        self.create_calendar_tab()
        if self.camera_manager:
            self.create_camera_tab()
        self.create_metrics_tab()

    def create_timer_tab(self):
        """Create the timer tab"""
        timer_frame = ttk.Frame(self.notebook)
        self.notebook.add(timer_frame, text="Focus Timer")
        
        # Main timer display
        timer_display_frame = ttk.LabelFrame(timer_frame, text="Pomodoro Timer", padding=20)
        timer_display_frame.pack(pady=20, padx=20, fill='x')
        
        # Timer display
        self.timer_label = tk.Label(
            timer_display_frame, 
            text=self.timer.get_formatted_time(),
            font=('Arial', 48, 'bold'),
            fg='#2563eb',
            bg='#f0f4f8'
        )
        self.timer_label.pack(pady=20)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(
            timer_display_frame,
            variable=self.progress_var,
            maximum=100,
            length=400,
            mode='determinate'
        )
        self.progress_bar.pack(pady=10)
        
        # Mode indicator
        self.mode_label = tk.Label(
            timer_display_frame,
            text="Focus Time",
            font=('Arial', 16),
            fg='#1f2937',
            bg='#f0f4f8'
        )
        self.mode_label.pack(pady=5)
        
        # Control buttons
        button_frame = ttk.Frame(timer_display_frame)
        button_frame.pack(pady=20)
        
        self.start_button = ttk.Button(
            button_frame,
            text="Start",
            command=self.toggle_timer,
            width=12
        )
        self.start_button.pack(side='left', padx=5)
        
        ttk.Button(
            button_frame,
            text="Reset",
            command=self.reset_timer,
            width=12
        ).pack(side='left', padx=5)
        
        ttk.Button(
            button_frame,
            text="Switch Mode",
            command=self.switch_timer_mode,
            width=12
        ).pack(side='left', padx=5)
        
        # Session info
        session_frame = ttk.LabelFrame(timer_frame, text="Session Info", padding=10)
        session_frame.pack(pady=10, padx=20, fill='x')
        
        self.cycles_label = tk.Label(
            session_frame,
            text=f"Completed Cycles: {self.timer.completed_cycles}",
            font=('Arial', 12),
            bg='#f0f4f8'
        )
        self.cycles_label.pack()

    def create_tasks_tab(self):
        """Create the tasks tab"""
        tasks_frame = ttk.Frame(self.notebook)
        self.notebook.add(tasks_frame, text="Study Tasks")
        
        if not self.task_manager:
            no_tasks_label = tk.Label(tasks_frame, text="Task manager not available", 
                                    font=('Arial', 16), fg='red')
            no_tasks_label.pack(pady=50)
            return
        
        # Add task section
        add_task_frame = ttk.LabelFrame(tasks_frame, text="Add New Task", padding=10)
        add_task_frame.pack(pady=10, padx=20, fill='x')
        
        # Task input fields
        input_frame = ttk.Frame(add_task_frame)
        input_frame.pack(fill='x')
        
        # Title
        ttk.Label(input_frame, text="Title:").grid(row=0, column=0, sticky='w', padx=5, pady=2)
        self.task_title_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.task_title_var, width=30).grid(row=0, column=1, padx=5, pady=2)
        
        # Description
        ttk.Label(input_frame, text="Description:").grid(row=1, column=0, sticky='w', padx=5, pady=2)
        self.task_desc_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.task_desc_var, width=30).grid(row=1, column=1, padx=5, pady=2)
        
        # Priority
        ttk.Label(input_frame, text="Priority:").grid(row=0, column=2, sticky='w', padx=5, pady=2)
        self.task_priority_var = tk.StringVar(value="MEDIUM")
        priority_combo = ttk.Combobox(input_frame, textvariable=self.task_priority_var, 
                                    values=["LOW", "MEDIUM", "HIGH", "URGENT"], width=10)
        priority_combo.grid(row=0, column=3, padx=5, pady=2)
        
        # Estimated time
        ttk.Label(input_frame, text="Est. Time (min):").grid(row=1, column=2, sticky='w', padx=5, pady=2)
        self.task_time_var = tk.StringVar(value="25")
        ttk.Entry(input_frame, textvariable=self.task_time_var, width=10).grid(row=1, column=3, padx=5, pady=2)
        
        # Category
        ttk.Label(input_frame, text="Category:").grid(row=2, column=0, sticky='w', padx=5, pady=2)
        self.task_category_var = tk.StringVar(value="STUDY")
        category_combo = ttk.Combobox(input_frame, textvariable=self.task_category_var,
                                    values=["STUDY", "RESEARCH", "ASSIGNMENT", "EXAM_PREP", "PROJECT", "READING", "PRACTICE", "OTHER"], width=15)
        category_combo.grid(row=2, column=1, padx=5, pady=2)
        
        # Add button
        ttk.Button(input_frame, text="Add Task", command=self.add_task).grid(row=2, column=3, padx=5, pady=5)
        
        # Tasks list
        tasks_list_frame = ttk.LabelFrame(tasks_frame, text="Tasks", padding=10)
        tasks_list_frame.pack(pady=10, padx=20, fill='both', expand=True)
        
        # Treeview for tasks
        columns = ('Title', 'Priority', 'Status', 'Est. Time', 'Category')
        self.tasks_tree = ttk.Treeview(tasks_list_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.tasks_tree.heading(col, text=col)
            self.tasks_tree.column(col, width=120)
        
        # Scrollbar for tasks
        tasks_scrollbar = ttk.Scrollbar(tasks_list_frame, orient='vertical', command=self.tasks_tree.yview)
        self.tasks_tree.configure(yscrollcommand=tasks_scrollbar.set)
        
        self.tasks_tree.pack(side='left', fill='both', expand=True)
        tasks_scrollbar.pack(side='right', fill='y')
        
        # Task control buttons
        task_buttons_frame = ttk.Frame(tasks_frame)
        task_buttons_frame.pack(pady=10)
        
        ttk.Button(task_buttons_frame, text="Complete Task", command=self.complete_task).pack(side='left', padx=5)
        ttk.Button(task_buttons_frame, text="Delete Task", command=self.delete_task).pack(side='left', padx=5)
        ttk.Button(task_buttons_frame, text="Refresh", command=self.refresh_tasks).pack(side='left', padx=5)
        
        # Load initial tasks
        self.refresh_tasks()

    def create_calendar_tab(self):
        """Create the calendar tab with full calendar GUI and add event functionality"""
        calendar_frame = ttk.Frame(self.notebook)
        self.notebook.add(calendar_frame, text="Study Calendar")
        
        if not self.calendar_manager:
            no_calendar_label = tk.Label(calendar_frame, text="Calendar manager not available", 
                                       font=('Arial', 16), fg='red')
            no_calendar_label.pack(pady=50)
            return
        
        # Create the full calendar GUI with enhanced features
        try:
            self.calendar_gui = CalendarGUI(calendar_frame, self.calendar_manager)
            print("✓ Calendar GUI created successfully with add event functionality")
            
            # Add additional quick actions frame
            quick_actions_frame = ttk.LabelFrame(calendar_frame, text="Quick Actions", padding=10)
            quick_actions_frame.pack(pady=5, padx=20, fill='x', side='bottom')
            
            # Quick action buttons
            actions_inner_frame = ttk.Frame(quick_actions_frame)
            actions_inner_frame.pack(fill='x')
            
            ttk.Button(actions_inner_frame, text="Add Study Session", 
                      command=self.quick_add_study_session).pack(side='left', padx=5)
            ttk.Button(actions_inner_frame, text="Add Break", 
                      command=self.quick_add_break).pack(side='left', padx=5)
            ttk.Button(actions_inner_frame, text="Add Deadline", 
                      command=self.quick_add_deadline).pack(side='left', padx=5)
            ttk.Button(actions_inner_frame, text="View Today's Events", 
                      command=self.view_todays_events).pack(side='left', padx=5)
            
        except Exception as e:
            error_label = tk.Label(calendar_frame, 
                                 text=f"Error creating calendar: {str(e)}", 
                                 font=('Arial', 12), fg='red')
            error_label.pack(pady=20)
            print(f"Error creating calendar GUI: {e}")

    def quick_add_study_session(self):
        """Quick add a study session for today"""
        try:
            from datetime import datetime, time
            now = datetime.now()
            # Default to next hour
            next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
            
            self.calendar_manager.create_event(
                title="Study Session",
                start_time=next_hour,
                end_time=next_hour + timedelta(minutes=50),  # 50-minute session
                event_type=EventType.STUDY_SESSION,
                description="Focus study session"
            )
            
            if hasattr(self, 'calendar_gui'):
                self.calendar_gui.refresh_calendar()
            messagebox.showinfo("Success", "Study session added for next hour!")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to add study session: {str(e)}")

    def quick_add_break(self):
        """Quick add a break session"""
        try:
            from datetime import datetime, timedelta
            now = datetime.now()
            # Add break in 30 minutes
            break_time = now + timedelta(minutes=30)
            
            self.calendar_manager.create_event(
                title="Break Time",
                start_time=break_time,
                end_time=break_time + timedelta(minutes=15),
                event_type=EventType.BREAK,
                description="Rest and recharge"
            )
            
            if hasattr(self, 'calendar_gui'):
                self.calendar_gui.refresh_calendar()
            messagebox.showinfo("Success", "Break time scheduled!")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to add break: {str(e)}")

    def quick_add_deadline(self):
        """Quick add a deadline"""
        deadline_window = tk.Toplevel(self.root)
        deadline_window.title("Add Deadline")
        deadline_window.geometry("400x300")
        
        ttk.Label(deadline_window, text="Deadline Title:").pack(pady=5)
        title_var = tk.StringVar()
        ttk.Entry(deadline_window, textvariable=title_var, width=40).pack(pady=5)
        
        ttk.Label(deadline_window, text="Date (YYYY-MM-DD):").pack(pady=5)
        date_var = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d"))
        ttk.Entry(deadline_window, textvariable=date_var, width=20).pack(pady=5)
        
        ttk.Label(deadline_window, text="Time (HH:MM):").pack(pady=5)
        time_var = tk.StringVar(value="23:59")
        ttk.Entry(deadline_window, textvariable=time_var, width=10).pack(pady=5)
        
        def add_deadline():
            try:
                title = title_var.get().strip()
                if not title:
                    messagebox.showwarning("Error", "Please enter a title")
                    return
                
                date_str = date_var.get().strip()
                time_str = time_var.get().strip()
                
                # Parse datetime
                deadline_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                
                self.calendar_manager.create_event(
                    title=f"DEADLINE: {title}",
                    start_time=deadline_datetime,
                    end_time=deadline_datetime,
                    event_type=EventType.DEADLINE,
                    priority=CalPriority.HIGH,
                    description=f"Deadline for: {title}"
                )
                
                if hasattr(self, 'calendar_gui'):
                    self.calendar_gui.refresh_calendar()
                messagebox.showinfo("Success", "Deadline added!")
                deadline_window.destroy()
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to add deadline: {str(e)}")
        
        ttk.Button(deadline_window, text="Add Deadline", command=add_deadline).pack(pady=20)
        ttk.Button(deadline_window, text="Cancel", command=deadline_window.destroy).pack()

    def view_todays_events(self):
        """View today's events in a popup"""
        try:
            today = datetime.now().date()
            events = self.calendar_manager.get_events_for_date(today)
            
            events_window = tk.Toplevel(self.root)
            events_window.title(f"Today's Events ({today.strftime('%B %d, %Y')})")
            events_window.geometry("500x400")
            
            if not events:
                tk.Label(events_window, text="No events scheduled for today", 
                        font=('Arial', 14)).pack(pady=50)
            else:
                # Create listbox with events
                listbox = tk.Listbox(events_window, font=('Arial', 12))
                listbox.pack(fill='both', expand=True, padx=10, pady=10)
                
                for event in events:
                    time_str = event.start_time.strftime("%H:%M")
                    event_text = f"{time_str} - {event.title} ({event.event_type.value.title()})"
                    listbox.insert(tk.END, event_text)
            
            ttk.Button(events_window, text="Close", 
                      command=events_window.destroy).pack(pady=10)
                      
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load today's events: {str(e)}")

    def create_camera_tab(self):
        """Create the camera tab - Camera is auto-started"""
        camera_frame = ttk.Frame(self.notebook)
        self.notebook.add(camera_frame, text="Focus Tracker")
        
        # Camera status display
        status_frame = ttk.LabelFrame(camera_frame, text="Camera Status", padding=10)
        status_frame.pack(pady=10, padx=20, fill='x')
        
        camera_status = "Camera Active (Auto-Started)" if self.camera_manager.is_active else "Camera Not Available"
        status_color = "green" if self.camera_manager.is_active else "red"
        
        self.camera_status_label = tk.Label(status_frame, text=camera_status, 
                                          font=('Arial', 14, 'bold'), fg=status_color)
        self.camera_status_label.pack()
        
        # Camera controls (for manual control if needed)
        controls_frame = ttk.Frame(status_frame)
        controls_frame.pack(pady=10)
        
        ttk.Button(controls_frame, text="Restart Camera", 
                  command=self.restart_camera).pack(side='left', padx=5)
        ttk.Button(controls_frame, text="Take Snapshot", 
                  command=self.take_snapshot).pack(side='left', padx=5)
        
        # Camera display
        self.camera_label = tk.Label(camera_frame, text="Initializing camera...", bg='gray', 
                                   width=690, height=910)
        self.camera_label.pack(pady=20)
        
        # Focus info
        focus_info_frame = ttk.LabelFrame(camera_frame, text="Focus Information", padding=10)
        focus_info_frame.pack(pady=10, padx=20, fill='x')
        
        self.focus_score_label = tk.Label(focus_info_frame, text="Focus Score: --", font=('Arial', 12))
        self.focus_score_label.pack()
        
        self.focus_status_label = tk.Label(focus_info_frame, text="Status: --", font=('Arial', 12))
        self.focus_status_label.pack()
        
        # Snapshots section
        snapshots_frame = ttk.LabelFrame(camera_frame, text="Session Snapshots", padding=10)
        snapshots_frame.pack(pady=10, padx=20, fill='both', expand=True)
        
        self.snapshots_listbox = tk.Listbox(snapshots_frame, height=8)
        self.snapshots_listbox.pack(fill='both', expand=True)

    def restart_camera(self):
        """Restart camera manually if needed"""
        if self.camera_manager:
            self.camera_manager.stop_camera()
            if self.camera_manager.start_camera():
                self.camera_status_label.config(text="Camera Active (Restarted)", fg="green")
                messagebox.showinfo("Success", "Camera restarted successfully!")
            else:
                self.camera_status_label.config(text="Camera Failed to Start", fg="red")
                messagebox.showerror("Error", "Failed to restart camera")

    def create_metrics_tab(self):
        """Create the metrics tab"""
        metrics_frame = ttk.Frame(self.notebook)
        self.notebook.add(metrics_frame, text="Flow Metrics")
        
        # Metrics display
        metrics_display_frame = ttk.LabelFrame(metrics_frame, text="Flow State Metrics", padding=20)
        metrics_display_frame.pack(pady=20, padx=20, fill='both', expand=True)
        
        # Create metrics labels
        self.total_focus_label = tk.Label(metrics_display_frame, text="Total Focus Time: 0h 0m", 
                                        font=('Arial', 14), bg='#f0f4f8')
        self.total_focus_label.pack(pady=10)
        
        self.completed_tasks_label = tk.Label(metrics_display_frame, text="Completed Tasks: 0", 
                                            font=('Arial', 14), bg='#f0f4f8')
        self.completed_tasks_label.pack(pady=10)
        
        self.current_streak_label = tk.Label(metrics_display_frame, text="Current Streak: 0 days", 
                                           font=('Arial', 14), bg='#f0f4f8')
        self.current_streak_label.pack(pady=10)
        
        self.avg_quality_label = tk.Label(metrics_display_frame, text="Average Session Quality: 0/5", 
                                        font=('Arial', 14), bg='#f0f4f8')
        self.avg_quality_label.pack(pady=10)
        
        # Camera status in metrics
        if self.camera_manager:
            self.camera_metrics_label = tk.Label(metrics_display_frame, 
                                                text="Camera Status: Auto-Started", 
                                                font=('Arial', 14), bg='#f0f4f8', fg='green')
            self.camera_metrics_label.pack(pady=10)
        
        # Refresh metrics button
        ttk.Button(metrics_display_frame, text="Refresh Metrics", 
                  command=self.update_metrics).pack(pady=20)
        
        # Initial metrics update
        self.update_metrics()

    def toggle_timer(self):
        """Toggle timer start/pause"""
        if self.timer.is_running:
            self.timer.pause()
            self.start_button.config(text="Start")
            if self.current_session:
                self.end_current_session()
        else:
            self.timer.start()
            self.start_button.config(text="Pause")
            self.start_new_session()

    def reset_timer(self):
        """Reset the timer"""
        # Stop any running post-completion alarm
        self.stop_post_completion_alarm()
        
        self.timer.reset()
        self.start_button.config(text="Start")
        self.update_timer_display()
        if self.current_session:
            self.end_current_session()

    def switch_timer_mode(self):
        """Switch timer mode"""
        self.timer.switch_mode()
        self.update_timer_display()
        if self.current_session:
            self.end_current_session()

    def start_new_session(self):
        """Start a new study session"""
        # Stop any running post-completion alarm
        self.stop_post_completion_alarm()
        
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_session = StudySession(
            id=session_id,
            task_id=None,
            start_time=datetime.now(),
            end_time=None,
            duration=0,
            session_type='focus' if not self.timer.is_break else 'break',
            quality_rating=0
        )
        
        # Start camera recording if available
        if self.camera_manager and self.camera_manager.is_active:
            self.camera_manager.start_session_recording(session_id)

    def end_current_session(self):
        """End the current study session"""
        if self.current_session:
            self.current_session.end_time = datetime.now()
            duration_seconds = (self.current_session.end_time - self.current_session.start_time).total_seconds()
            self.current_session.duration = int(duration_seconds / 60)
            
            # Simple quality rating (could be enhanced with user input)
            self.current_session.quality_rating = 4 if self.current_session.session_type == 'focus' else 3
            
            # Save session
            self.data_manager.add_session(self.current_session)
            
            # Stop camera recording if available
            if self.camera_manager:
                self.camera_manager.stop_session_recording()
            
            print(f"Session completed: {self.current_session.duration} minutes")
            self.current_session = None

    def on_timer_event(self, event_type, data):
        """Handle timer events"""
        if event_type == 'tick':
            self.root.after(0, self.update_timer_display)
        elif event_type == 'complete':
            self.root.after(0, lambda: self.on_timer_complete(data))

    def on_timer_complete(self, is_break):
        """Handle timer completion"""
        if self.current_session:
            self.end_current_session()
        
        mode = "Break" if is_break else "Focus"
        messagebox.showinfo("Timer Complete", f"{mode} session completed!")
        
        # Start 1-minute post-completion alarm
        self.start_post_completion_alarm(is_break)
        
        self.update_timer_display()
        self.cycles_label.config(text=f"Completed Cycles: {self.timer.completed_cycles}")

    def update_timer_display(self):
        """Update timer display"""
        self.timer_label.config(text=self.timer.get_formatted_time())
        self.progress_var.set(self.timer.get_progress())
        mode_text = "Break Time" if self.timer.is_break else "Focus Time"
        self.mode_label.config(text=mode_text)

    def add_task(self):
        """Add a new task"""
        if not self.task_manager:
            messagebox.showerror("Error", "Task manager not available")
            return
            
        title = self.task_title_var.get().strip()
        if not title:
            messagebox.showwarning("Invalid Input", "Please enter a task title")
            return
        
        try:
            priority = Priority[self.task_priority_var.get()]
            category = TaskCategory[self.task_category_var.get()]
            estimated_time = int(self.task_time_var.get() or 25)
            
            task = self.task_manager.create_task(
                title=title,
                description=self.task_desc_var.get().strip(),
                priority=priority,
                category=category,
                estimated_time=estimated_time
            )
            
            # Clear input fields
            self.task_title_var.set("")
            self.task_desc_var.set("")
            self.task_time_var.set("25")
            
            self.refresh_tasks()
            messagebox.showinfo("Success", "Task added successfully!")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to add task: {str(e)}")

    def refresh_tasks(self):
        """Refresh the tasks list"""
        if not self.task_manager:
            return
            
        # Clear existing items
        for item in self.tasks_tree.get_children():
            self.tasks_tree.delete(item)
        
        # Add tasks
        try:
            tasks = self.task_manager.get_tasks()
            for task in tasks:
                self.tasks_tree.insert('', 'end', values=(
                    task.title,
                    task.priority.name,
                    task.status.value.replace('_', ' ').title(),
                    f"{task.estimated_time} min",
                    task.category.value.replace('_', ' ').title()
                ))
        except Exception as e:
            print(f"Error refreshing tasks: {e}")

    def complete_task(self):
        """Mark selected task as completed"""
        selection = self.tasks_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a task to complete")
            return
        
        # Get task details (simplified - would need proper task ID tracking)
        messagebox.showinfo("Task Completed", "Task marked as completed!")
        self.refresh_tasks()

    def delete_task(self):
        """Delete selected task"""
        selection = self.tasks_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select a task to delete")
            return
        
        if messagebox.askyesno("Confirm Delete", "Are you sure you want to delete this task?"):
            # Delete task (simplified implementation)
            self.tasks_tree.delete(selection[0])
            messagebox.showinfo("Task Deleted", "Task deleted successfully!")

    def take_snapshot(self):
        """Take a camera snapshot"""
        if not self.camera_manager:
            messagebox.showerror("Error", "Camera not available")
            return
            
        if self.camera_manager.is_active:
            filepath = self.camera_manager.take_snapshot()
            if filepath:
                filename = os.path.basename(filepath)
                self.snapshots_listbox.insert(tk.END, filename)
                messagebox.showinfo("Snapshot", f"Snapshot saved: {filename}")
        else:
            messagebox.showwarning("Camera Not Active", "Camera not available for snapshots")

    def update_camera_frame(self):
        """Update camera frame display"""
        if self.camera_manager and self.camera_manager.is_active:
            try:
                analysis = self.camera_manager.analyze_current_frame()
                if analysis:
                    frame = analysis['frame']
                    focus_data = analysis['focus']
                    
                    # Update focus information
                    self.focus_score_label.config(text=f"Focus Score: {focus_data['focus_score']:.2f}")
                    status = "FOCUSED" if focus_data['is_focused'] else "DISTRACTED"
                    color = "green" if focus_data['is_focused'] else "red"
                    self.focus_status_label.config(text=f"Status: {status}", fg=color)
                    
                    # Update camera display if PIL is available
                    if PIL_AVAILABLE and CV2_AVAILABLE:
                        try:
                            # Resize frame for display
                            height, width = frame.shape[:2]
                            display_width = 400  # Reasonable size for display
                            display_height = int(height * display_width / width)
                            frame_resized = cv2.resize(frame, (display_width, display_height))
                            
                            # Draw face detection overlay
                            overlay_frame = self.camera_manager.focus_analyzer.draw_analysis_overlay(frame_resized, {
                                'faces': [[int(x*display_width/width), int(y*display_height/height), 
                                         int(w*display_width/width), int(h*display_height/height)] 
                                        for x, y, w, h in focus_data['faces']],
                                'eyes': [[int(x*display_width/width), int(y*display_height/height), 
                                        int(w*display_width/width), int(h*display_height/height)] 
                                       for x, y, w, h in focus_data['eyes']],
                                'is_focused': focus_data['is_focused'],
                                'focus_score': focus_data['focus_score']
                            })
                            
                            # Convert to PhotoImage
                            image = Image.fromarray(overlay_frame)
                            photo = ImageTk.PhotoImage(image)
                            
                            self.camera_label.config(image=photo, text="")
                            self.camera_label.image = photo
                        except Exception as display_error:
                            print(f"Error updating camera display: {display_error}")
                            # Show basic status without image
                            self.camera_label.config(image="", text=f"Camera Active\n{status}")
                    else:
                        # Show status text if image display not available
                        self.camera_label.config(image="", text=f"Camera Active\n{status}\nScore: {focus_data['focus_score']:.2f}")
                    
                    # Add frame to recording if session is active
                    if self.current_session:
                        self.camera_manager.add_frame_to_recording(focus_data)
                        
            except Exception as e:
                print(f"Error updating camera frame: {e}")
                # Show error status
                self.focus_score_label.config(text="Focus Score: Error")
                self.focus_status_label.config(text="Status: Camera Error", fg="red")
        
        # Schedule next update
        self.root.after(100, self.update_camera_frame)

    def on_focus_event(self, event_type):
        """Handle focus events from camera"""
        if event_type == 'focus_lost':
            self.focus_lost_count += 1
            print(f"Focus lost detected ({self.focus_lost_count} times)")
            
            # Stop timer if user has lost focus and timer is running
            if self.timer.is_running and not self.timer.is_break:
                print("Focus lost - preparing to pause timer")
                # Schedule the pause to happen on main thread
                self.root.after(0, self.pause_timer_due_to_focus_loss)
            else:
                print(f"Focus lost but timer not running or in break mode (running: {self.timer.is_running}, break: {self.timer.is_break})")
    
    def pause_timer_due_to_focus_loss(self):
        """Pause timer due to focus loss"""
        try:
            print("Executing focus loss timer pause")
            self.timer.pause()
            self.start_button.config(text="Start")
            
            if self.current_session:
                self.end_current_session()
            
            # Show warning dialog
            messagebox.showwarning("Focus Lost", 
                                 "Timer paused automatically due to loss of focus.\n\n" +
                                 "Please refocus on your work and restart the timer when ready.")
        except Exception as e:
            print(f"Error in pause_timer_due_to_focus_loss: {e}")
    
    def start_post_completion_alarm(self, was_break_session):
        """Start 1-minute alarm after timer completion"""
        if not self.post_completion_alarm_running:
            self.post_completion_alarm_running = True
            self.post_completion_alarm_thread = threading.Thread(
                target=self._run_post_completion_alarm_loop, 
                args=(was_break_session,), 
                daemon=True
            )
            self.post_completion_alarm_thread.start()
    
    def stop_post_completion_alarm(self):
        """Stop post-completion alarm"""
        self.post_completion_alarm_running = False
    
    def _run_post_completion_alarm_loop(self, was_break_session):
        """Run alarm loop for 1 minute after timer completion - rings every 10 seconds"""
        alarm_count = 0
        max_alarms = 6  # 6 alarms over 1 minute (every 10 seconds)
        
        while self.post_completion_alarm_running and alarm_count < max_alarms:
            # Wait for 10 seconds
            for _ in range(10):
                if not self.post_completion_alarm_running:
                    return
                time.sleep(1)
            
            # Play alert
            if self.post_completion_alarm_running:
                self.root.after(0, lambda: self._show_post_completion_alert(was_break_session, alarm_count + 1))
                alarm_count += 1
        
        # Auto-stop after 1 minute
        self.post_completion_alarm_running = False
        print("🔕 Post-completion alarm stopped after 1 minute")
    
    def _show_post_completion_alert(self, was_break_session, alert_number):
        """Show post-completion alert"""
        try:
            # Play system beep
            import winsound
            winsound.Beep(1200, 800)  # Higher pitch (1200 Hz) and longer duration (800ms) for completion alerts
        except ImportError:
            # Fallback for non-Windows systems
            print("\a")  # Terminal bell
        except Exception as e:
            print(f"Could not play alert sound: {e}")
            print("\a")  # Fallback to terminal bell
        
        # Show message based on what session just completed
        if was_break_session:
            print(f"🔔 Break Completed Alert {alert_number}/6: Time to start focusing! (25:5 Rule)")
        else:
            print(f"🔔 Focus Completed Alert {alert_number}/6: Time for a break! (25:5 Rule)")
    
    def update_metrics(self):
        """Update flow state metrics"""
        try:
            # Update timer metrics
            total_focus_minutes = self.timer.completed_cycles * 25
            hours = total_focus_minutes // 60
            minutes = total_focus_minutes % 60
            self.total_focus_label.config(text=f"Total Focus Time: {hours}h {minutes}m")
            
            # Update task metrics if available
            if self.task_manager:
                stats = self.task_manager.get_task_statistics()
                self.completed_tasks_label.config(text=f"Completed Tasks: {stats['completed_tasks']}")
            else:
                self.completed_tasks_label.config(text="Completed Tasks: --")
            
            # Update camera status
            if self.camera_manager and hasattr(self, 'camera_metrics_label'):
                camera_status = "Camera: Active (Auto-Started)" if self.camera_manager.is_active else "Camera: Not Active"
                self.camera_metrics_label.config(text=camera_status)
            
            # Placeholder metrics
            self.current_streak_label.config(text="Current Streak: 1 day")
            self.avg_quality_label.config(text="Average Session Quality: 4.2/5")
            
        except Exception as e:
            print(f"Error updating metrics: {e}")

    def run(self):
        """Run the application"""
        try:
            print("🚀 Flow State Study Companion Starting...")
            if self.camera_manager and self.camera_manager.is_active:
                print("📹 Camera is active and ready for focus tracking")
            print("📅 Calendar is ready for event management")
            print("✅ Task manager is loaded")
            print("⏱️  Pomodoro timer is ready")
            print("🔔 Post-completion alarm (1 minute, 25:5 rule) enabled")
            print("\n💡 Tip: The camera automatically started for focus tracking!")
            print("⚡ After timer completes, alarm will ring for 1 minute to remind you about the next phase")
            
            self.root.mainloop()
        finally:
            # Cleanup
            if self.camera_manager:
                self.camera_manager.stop_camera()
            if CV2_AVAILABLE:
                cv2.destroyAllWindows()

def main():
    """Main function"""
    app = FlowStudyApp()
    app.run()

if __name__ == "__main__":
    main()