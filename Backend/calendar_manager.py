#!/usr/bin/env python3
"""
Advanced calendar manager for study scheduling with flow state optimization
Consolidated version including GUI functionality
"""

import json
import os
from datetime import datetime, timedelta, date, time
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import calendar
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import time as time_module
import winsound

class EventType(Enum):
    STUDY_SESSION = "study_session"
    BREAK = "break"
    DEADLINE = "deadline"
    EXAM = "exam"
    ASSIGNMENT_DUE = "assignment_due"
    CLASS = "class"
    MEETING = "meeting"
    PERSONAL = "personal"

class RecurrenceType(Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class CalendarEvent:
    id: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    event_type: EventType
    priority: Priority
    location: str = ""
    tags: List[str] = None
    task_id: Optional[str] = None
    recurrence: RecurrenceType = RecurrenceType.NONE
    recurrence_end: Optional[datetime] = None
    reminder_minutes: List[int] = None  # Minutes before event to remind
    color: str = "#3B82F6"
    is_completed: bool = False
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.tags is None:
            self.tags = []
        if self.reminder_minutes is None:
            self.reminder_minutes = [15]  # Default 15 minutes reminder

@dataclass
class StudyBlock:
    """Represents an optimal study time block"""
    start_time: datetime
    end_time: datetime
    energy_level: int  # 1-5
    focus_level: int   # 1-5
    recommended_task_types: List[str]
    duration_minutes: int = 0
    
    def __post_init__(self):
        if self.duration_minutes == 0:
            self.duration_minutes = int((self.end_time - self.start_time).total_seconds() / 60)

class FlowCalendarOptimizer:
    """Optimizes calendar scheduling based on flow state principles"""
    
    def __init__(self):
        # Default energy and focus patterns throughout the day
        self.daily_patterns = {
            6: {'energy': 3, 'focus': 4},   # Early morning
            7: {'energy': 4, 'focus': 4},   # Morning
            8: {'energy': 4, 'focus': 5},   # Peak morning
            9: {'energy': 5, 'focus': 5},   # Peak focus time
            10: {'energy': 5, 'focus': 5},  # Peak focus time
            11: {'energy': 4, 'focus': 4},  # Late morning
            12: {'energy': 3, 'focus': 3},  # Lunch time
            13: {'energy': 2, 'focus': 2},  # Post-lunch dip
            14: {'energy': 3, 'focus': 3},  # Early afternoon
            15: {'energy': 4, 'focus': 4},  # Afternoon
            16: {'energy': 4, 'focus': 4},  # Late afternoon
            17: {'energy': 3, 'focus': 3},  # Evening
            18: {'energy': 3, 'focus': 2},  # Early evening
            19: {'energy': 2, 'focus': 2},  # Evening
            20: {'energy': 2, 'focus': 3},  # Night (creative time)
            21: {'energy': 2, 'focus': 3},  # Night
            22: {'energy': 1, 'focus': 2},  # Late night
        }
        
        # Task type recommendations based on energy/focus levels
        self.task_recommendations = {
            (5, 5): ['complex_problem_solving', 'deep_learning', 'research'],
            (5, 4): ['coding', 'writing', 'analysis'],
            (4, 5): ['studying', 'memorization', 'practice'],
            (4, 4): ['reading', 'note_taking', 'review'],
            (3, 3): ['organization', 'planning', 'light_reading'],
            (2, 2): ['break', 'exercise', 'casual_review'],
            (1, 1): ['rest', 'meditation', 'light_activities']
        }
    
    def get_optimal_study_blocks(self, target_date: date, 
                               existing_events: List[CalendarEvent],
                               min_block_duration: int = 25,
                               max_block_duration: int = 120) -> List[StudyBlock]:
        """Find optimal study blocks for a given date"""
        study_blocks = []
        
        # Create time slots for the day (every 15 minutes from 6 AM to 11 PM)
        start_time = datetime.combine(target_date, datetime.min.time().replace(hour=6))
        end_time = datetime.combine(target_date, datetime.min.time().replace(hour=23))
        
        # Get busy times from existing events
        busy_times = []
        for event in existing_events:
            if event.start_time.date() == target_date:
                busy_times.append((event.start_time, event.end_time))
        
        # Sort busy times
        busy_times.sort(key=lambda x: x[0])
        
        # Find free time slots
        current_time = start_time
        for busy_start, busy_end in busy_times:
            if current_time < busy_start:
                # Found a free slot
                free_duration = int((busy_start - current_time).total_seconds() / 60)
                if free_duration >= min_block_duration:
                    # Create study blocks within this free time
                    blocks = self._create_study_blocks_in_timespan(
                        current_time, busy_start, min_block_duration, max_block_duration
                    )
                    study_blocks.extend(blocks)
            current_time = max(current_time, busy_end)
        
        # Check for free time after last event
        if current_time < end_time:
            free_duration = int((end_time - current_time).total_seconds() / 60)
            if free_duration >= min_block_duration:
                blocks = self._create_study_blocks_in_timespan(
                    current_time, end_time, min_block_duration, max_block_duration
                )
                study_blocks.extend(blocks)
        
        return study_blocks
    
    def _create_study_blocks_in_timespan(self, start: datetime, end: datetime,
                                       min_duration: int, max_duration: int) -> List[StudyBlock]:
        """Create optimal study blocks within a time span"""
        blocks = []
        current = start
        
        while current < end:
            # Get energy and focus levels for current time
            hour = current.hour
            pattern = self.daily_patterns.get(hour, {'energy': 3, 'focus': 3})
            energy = pattern['energy']
            focus = pattern['focus']
            
            # Determine optimal block duration based on energy/focus
            if energy >= 4 and focus >= 4:
                block_duration = min(max_duration, 90)  # Long blocks for high energy/focus
            elif energy >= 3 and focus >= 3:
                block_duration = min(max_duration, 60)  # Medium blocks
            else:
                block_duration = min_duration  # Short blocks for low energy/focus
            
            # Ensure block fits within available time
            remaining_time = int((end - current).total_seconds() / 60)
            block_duration = min(block_duration, remaining_time)
            
            if block_duration >= min_duration:
                block_end = current + timedelta(minutes=block_duration)
                
                # Get task recommendations
                key = (min(5, energy), min(5, focus))
                recommended_tasks = self.task_recommendations.get(key, ['general_study'])
                
                block = StudyBlock(
                    start_time=current,
                    end_time=block_end,
                    energy_level=energy,
                    focus_level=focus,
                    recommended_task_types=recommended_tasks,
                    duration_minutes=block_duration
                )
                blocks.append(block)
                
                # Add break time after study block
                break_duration = 15 if block_duration <= 30 else 30
                current = block_end + timedelta(minutes=break_duration)
            else:
                break
        
        return blocks
    
    def suggest_event_time(self, duration_minutes: int, preferred_date: date,
                          event_type: EventType, existing_events: List[CalendarEvent],
                          earliest_time: int = 8, latest_time: int = 20) -> Optional[datetime]:
        """Suggest optimal time for an event"""
        study_blocks = self.get_optimal_study_blocks(preferred_date, existing_events)
        
        # Filter blocks that can accommodate the event
        suitable_blocks = [b for b in study_blocks if b.duration_minutes >= duration_minutes]
        
        if not suitable_blocks:
            return None
        
        # Score blocks based on event type
        scored_blocks = []
        for block in suitable_blocks:
            score = self._score_block_for_event(block, event_type)
            scored_blocks.append((block, score))
        
        # Sort by score (descending)
        scored_blocks.sort(key=lambda x: x[1], reverse=True)
        
        # Return start time of best block
        return scored_blocks[0][0].start_time
    
    def _score_block_for_event(self, block: StudyBlock, event_type: EventType) -> float:
        """Score how well a time block fits an event type"""
        score = 0.0
        
        if event_type == EventType.STUDY_SESSION:
            # Prefer high focus times
            score += block.focus_level * 0.4
            score += block.energy_level * 0.3
            # Prefer longer blocks
            score += min(block.duration_minutes / 120, 1.0) * 0.3
        
        elif event_type == EventType.EXAM:
            # Prefer peak performance times
            score += block.focus_level * 0.5
            score += block.energy_level * 0.5
        
        elif event_type == EventType.BREAK:
            # Prefer low energy times
            score += (5 - block.energy_level) * 0.6
            score += (5 - block.focus_level) * 0.4
        
        else:  # Default scoring
            score += (block.focus_level + block.energy_level) * 0.25
        
        return score

class NotificationSystem:
    """Handles event notifications and alarms"""
    
    def __init__(self):
        self.notification_thread = None
        self.running = False
        
    def start_monitoring(self, calendar_manager):
        """Start monitoring for upcoming events"""
        if not self.running:
            self.running = True
            self.notification_thread = threading.Thread(
                target=self._monitor_events, 
                args=(calendar_manager,),
                daemon=True
            )
            self.notification_thread.start()
    
    def stop_monitoring(self):
        """Stop monitoring for events"""
        self.running = False
    
    def _monitor_events(self, calendar_manager):
        """Monitor events and send notifications"""
        while self.running:
            try:
                current_time = datetime.now()
                upcoming_events = calendar_manager.get_upcoming_events(days=1)
                
                for event in upcoming_events:
                    for reminder_minutes in event.reminder_minutes:
                        reminder_time = event.start_time - timedelta(minutes=reminder_minutes)
                        
                        # Check if we should send notification (within 1 minute)
                        time_diff = abs((current_time - reminder_time).total_seconds())
                        if time_diff <= 30:  # 30 second window
                            self._send_notification(event, reminder_minutes)
                    
                    # Check for event start time (exact time notification)
                    start_time_diff = abs((current_time - event.start_time).total_seconds())
                    if start_time_diff <= 30:  # 30 second window
                        self._play_alarm()
                        self._send_start_notification(event)
                        
            except Exception as e:
                print(f"Error in notification monitoring: {e}")
            
            time_module.sleep(30)  # Check every 30 seconds
    
    def _send_notification(self, event: CalendarEvent, minutes_before: int):
        """Send notification for upcoming event"""
        try:
            title = "Upcoming Event Reminder"
            message = f"{event.title}\n\nStarts in {minutes_before} minutes\nTime: {event.start_time.strftime('%H:%M')}"
            
            # Try to show system notification if tkinter is available
            try:
                root = tk.Tk()
                root.withdraw()  # Hide main window
                messagebox.showinfo(title, message)
                root.destroy()
            except:
                print(f"REMINDER: {message}")
        except Exception as e:
            print(f"Error sending notification: {e}")
    
    def _send_start_notification(self, event: CalendarEvent):
        """Send notification when event starts"""
        try:
            title = "Event Started"
            message = f"{event.title} has started!\n\nTime: {event.start_time.strftime('%H:%M')}"
            
            try:
                root = tk.Tk()
                root.withdraw()
                messagebox.showinfo(title, message)
                root.destroy()
            except:
                print(f"EVENT STARTED: {message}")
        except Exception as e:
            print(f"Error sending start notification: {e}")
    
    def _play_alarm(self):
        """Play alarm sound"""
        try:
            # Play Windows system sound for 0.5 seconds
            winsound.Beep(1000, 500)  # 1000 Hz for 500ms
        except Exception as e:
            print(f"Could not play alarm: {e}")
            # Fallback: print alert
            print("\a" * 3)  # Terminal bell

class CalendarManager:
    """Advanced calendar management system"""
    
    def __init__(self, data_file: str = "calendar.json"):
        self.data_file = data_file
        self.events: Dict[str, CalendarEvent] = {}
        self.optimizer = FlowCalendarOptimizer()
        self.notification_system = NotificationSystem()
        
        # Event type color mappings
        self.event_colors = {
            EventType.MEETING: "#EF4444",        # Red
            EventType.STUDY_SESSION: "#10B981", # Green
            EventType.EXAM: "#F59E0B",          # Yellow/Orange
            EventType.PERSONAL: "#3B82F6",      # Blue
            EventType.DEADLINE: "#EF4444",      # Red
            EventType.ASSIGNMENT_DUE: "#F59E0B", # Yellow/Orange
            EventType.CLASS: "#8B5CF6",        # Purple
            EventType.BREAK: "#6B7280",        # Gray
        }
        
        self.load_events()
        # Start notification monitoring
        self.notification_system.start_monitoring(self)
    
    def load_events(self):
        """Load events from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for event_data in data.get('events', []):
                        event = self._dict_to_event(event_data)
                        self.events[event.id] = event
            except Exception as e:
                print(f"Error loading events: {e}")
    
    def save_events(self):
        """Save events to file"""
        try:
            data = {
                'events': [self._event_to_dict(event) for event in self.events.values()],
                'last_updated': datetime.now().isoformat()
            }
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving events: {e}")
    
    def _event_to_dict(self, event: CalendarEvent) -> dict:
        """Convert event to dictionary for JSON serialization"""
        event_dict = asdict(event)
        event_dict['event_type'] = event.event_type.value
        event_dict['priority'] = event.priority.value
        event_dict['recurrence'] = event.recurrence.value
        event_dict['start_time'] = event.start_time.isoformat()
        event_dict['end_time'] = event.end_time.isoformat()
        event_dict['created_at'] = event.created_at.isoformat()
        if event.recurrence_end:
            event_dict['recurrence_end'] = event.recurrence_end.isoformat()
        return event_dict
    
    def _dict_to_event(self, event_dict: dict) -> CalendarEvent:
        """Convert dictionary to event object"""
        event_dict = event_dict.copy()
        event_dict['event_type'] = EventType(event_dict['event_type'])
        event_dict['priority'] = Priority(event_dict['priority'])
        event_dict['recurrence'] = RecurrenceType(event_dict['recurrence'])
        event_dict['start_time'] = datetime.fromisoformat(event_dict['start_time'])
        event_dict['end_time'] = datetime.fromisoformat(event_dict['end_time'])
        event_dict['created_at'] = datetime.fromisoformat(event_dict['created_at'])
        if event_dict.get('recurrence_end'):
            event_dict['recurrence_end'] = datetime.fromisoformat(event_dict['recurrence_end'])
        return CalendarEvent(**event_dict)
    
    def create_event(self, title: str, start_time: datetime, end_time: datetime,
                    event_type: EventType = EventType.STUDY_SESSION,
                    priority: Priority = Priority.MEDIUM,
                    description: str = "", location: str = "",
                    tags: List[str] = None, task_id: str = None,
                    recurrence: RecurrenceType = RecurrenceType.NONE,
                    reminder_minutes: List[int] = None,
                    color: str = None) -> CalendarEvent:
        """Create a new calendar event"""
        # Auto-assign color based on event type if not provided
        if color is None:
            color = self.event_colors.get(event_type, "#3B82F6")
        
        event = CalendarEvent(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            start_time=start_time,
            end_time=end_time,
            event_type=event_type,
            priority=priority,
            location=location,
            tags=tags or [],
            task_id=task_id,
            recurrence=recurrence,
            reminder_minutes=reminder_minutes or [15],
            color=color
        )
        
        self.events[event.id] = event
        
        # Create recurring events if needed
        if recurrence != RecurrenceType.NONE:
            self._create_recurring_events(event)
        
        self.save_events()
        
        # Show success message
        print(f"Event '{title}' added successfully!")
        
        return event
        
    def create_event_with_time_input(self, title: str, date_str: str, time_str: str, 
                                   duration_minutes: int = 60, event_type: EventType = EventType.STUDY_SESSION,
                                   am_pm: str = "AM") -> Optional[CalendarEvent]:
        """Create event with user-friendly time input (with AM/PM)"""
        try:
            # Parse date (format: YYYY-MM-DD or MM/DD/YYYY)
            if '/' in date_str:
                month, day, year = map(int, date_str.split('/'))
                target_date = date(year, month, day)
            else:
                year, month, day = map(int, date_str.split('-'))
                target_date = date(year, month, day)
            
            # Parse time (format: HH:MM)
            hour, minute = map(int, time_str.split(':'))
            
            # Convert to 24-hour format
            if am_pm.upper() == "PM" and hour != 12:
                hour += 12
            elif am_pm.upper() == "AM" and hour == 12:
                hour = 0
            
            start_datetime = datetime.combine(target_date, time(hour, minute))
            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
            
            return self.create_event(
                title=title,
                start_time=start_datetime,
                end_time=end_datetime,
                event_type=event_type
            )
            
        except Exception as e:
            print(f"Error creating event: {e}")
            return None
    
    def _create_recurring_events(self, base_event: CalendarEvent):
        """Create recurring events based on recurrence pattern"""
        if base_event.recurrence == RecurrenceType.NONE:
            return
        
        current_start = base_event.start_time
        current_end = base_event.end_time
        
        # Determine recurrence delta
        if base_event.recurrence == RecurrenceType.DAILY:
            delta = timedelta(days=1)
        elif base_event.recurrence == RecurrenceType.WEEKLY:
            delta = timedelta(weeks=1)
        elif base_event.recurrence == RecurrenceType.MONTHLY:
            delta = timedelta(days=30)  # Approximate
        else:
            return
        
        # Create recurring events (limit to avoid infinite loops)
        max_occurrences = 52  # Max 1 year of weekly events
        occurrence_count = 0
        
        while occurrence_count < max_occurrences:
            current_start += delta
            current_end += delta
            
            # Check if we've exceeded the recurrence end date
            if (base_event.recurrence_end and 
                current_start > base_event.recurrence_end):
                break
            
            # Create recurring event
            recurring_event = CalendarEvent(
                id=str(uuid.uuid4()),
                title=base_event.title,
                description=base_event.description,
                start_time=current_start,
                end_time=current_end,
                event_type=base_event.event_type,
                priority=base_event.priority,
                location=base_event.location,
                tags=base_event.tags.copy(),
                task_id=base_event.task_id,
                recurrence=RecurrenceType.NONE,  # Don't recurse
                reminder_minutes=base_event.reminder_minutes.copy(),
                color=base_event.color
            )
            
            self.events[recurring_event.id] = recurring_event
            occurrence_count += 1
    
    def update_event(self, event_id: str, **kwargs) -> bool:
        """Update an existing event"""
        if event_id not in self.events:
            return False
        
        event = self.events[event_id]
        for key, value in kwargs.items():
            if hasattr(event, key):
                setattr(event, key, value)
        
        self.save_events()
        return True
    
    def delete_event(self, event_id: str) -> bool:
        """Delete an event"""
        if event_id in self.events:
            del self.events[event_id]
            self.save_events()
            return True
        return False
    
    def get_event(self, event_id: str) -> Optional[CalendarEvent]:
        """Get a specific event"""
        return self.events.get(event_id)
    
    def get_events_for_date(self, target_date: date) -> List[CalendarEvent]:
        """Get all events for a specific date"""
        events = []
        for event in self.events.values():
            if event.start_time.date() == target_date:
                events.append(event)
        
        # Sort by start time
        events.sort(key=lambda e: e.start_time)
        return events
    
    def get_events_for_week(self, start_date: date) -> Dict[date, List[CalendarEvent]]:
        """Get events for a week starting from start_date"""
        week_events = {}
        
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            week_events[current_date] = self.get_events_for_date(current_date)
        
        return week_events
    
    def get_events_for_month(self, year: int, month: int) -> Dict[date, List[CalendarEvent]]:
        """Get events for a specific month"""
        month_events = {}
        
        # Get all days in the month
        _, last_day = calendar.monthrange(year, month)
        
        for day in range(1, last_day + 1):
            current_date = date(year, month, day)
            month_events[current_date] = self.get_events_for_date(current_date)
        
        return month_events
    
    def get_upcoming_events(self, days: int = 7) -> List[CalendarEvent]:
        """Get upcoming events in the next N days"""
        now = datetime.now()
        future = now + timedelta(days=days)
        
        upcoming = []
        for event in self.events.values():
            if now <= event.start_time <= future:
                upcoming.append(event)
        
        # Sort by start time
        upcoming.sort(key=lambda e: e.start_time)
        return upcoming
    
    def get_overdue_events(self) -> List[CalendarEvent]:
        """Get overdue events that haven't been completed"""
        now = datetime.now()
        overdue = []
        
        for event in self.events.values():
            if (event.end_time < now and 
                not event.is_completed and 
                event.event_type in [EventType.ASSIGNMENT_DUE, EventType.DEADLINE]):
                overdue.append(event)
        
        return overdue
    
    def find_free_time(self, duration_minutes: int, start_date: date,
                      end_date: date, earliest_hour: int = 8,
                      latest_hour: int = 20) -> List[Tuple[datetime, datetime]]:
        """Find free time slots of specified duration"""
        free_slots = []
        current_date = start_date
        
        while current_date <= end_date:
            # Get events for this date
            day_events = self.get_events_for_date(current_date)
            
            # Find free slots using optimizer
            study_blocks = self.optimizer.get_optimal_study_blocks(
                current_date, day_events, duration_minutes
            )
            
            for block in study_blocks:
                if block.duration_minutes >= duration_minutes:
                    slot_end = block.start_time + timedelta(minutes=duration_minutes)
                    free_slots.append((block.start_time, slot_end))
            
            current_date += timedelta(days=1)
        
        return free_slots
    
    def suggest_study_schedule(self, target_date: date, 
                             study_hours: int = 4) -> List[CalendarEvent]:
        """Suggest an optimal study schedule for a date"""
        existing_events = self.get_events_for_date(target_date)
        study_blocks = self.optimizer.get_optimal_study_blocks(
            target_date, existing_events
        )
        
        # Select best blocks to reach target study hours
        total_minutes = study_hours * 60
        selected_blocks = []
        current_minutes = 0
        
        # Sort blocks by quality (focus + energy)
        study_blocks.sort(key=lambda b: b.focus_level + b.energy_level, reverse=True)
        
        for block in study_blocks:
            if current_minutes >= total_minutes:
                break
            
            remaining_minutes = total_minutes - current_minutes
            block_duration = min(block.duration_minutes, remaining_minutes)
            
            # Create study event
            study_event = CalendarEvent(
                id=str(uuid.uuid4()),
                title=f"Study Session ({block.recommended_task_types[0]})",
                description=f"Optimal study time - Energy: {block.energy_level}/5, Focus: {block.focus_level}/5",
                start_time=block.start_time,
                end_time=block.start_time + timedelta(minutes=block_duration),
                event_type=EventType.STUDY_SESSION,
                priority=Priority.HIGH,
                color="#10B981"  # Green for study sessions
            )
            
            selected_blocks.append(study_event)
            current_minutes += block_duration
        
        return selected_blocks
    
    def get_calendar_statistics(self) -> dict:
        """Get calendar usage statistics"""
        all_events = list(self.events.values())
        now = datetime.now()
        
        # Basic counts
        total_events = len(all_events)
        completed_events = len([e for e in all_events if e.is_completed])
        upcoming_events = len([e for e in all_events if e.start_time > now])
        
        # Event type distribution
        type_counts = {}
        for event in all_events:
            event_type = event.event_type.value
            type_counts[event_type] = type_counts.get(event_type, 0) + 1
        
        # Study time statistics
        study_events = [e for e in all_events if e.event_type == EventType.STUDY_SESSION]
        total_study_time = sum(
            (e.end_time - e.start_time).total_seconds() / 3600 
            for e in study_events
        )
        
        # This week's study time
        week_start = now - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=7)
        this_week_study = sum(
            (e.end_time - e.start_time).total_seconds() / 3600
            for e in study_events
            if week_start <= e.start_time <= week_end
        )
        
        return {
            'total_events': total_events,
            'completed_events': completed_events,
            'upcoming_events': upcoming_events,
            'completion_rate': (completed_events / total_events * 100) if total_events > 0 else 0,
            'event_type_distribution': type_counts,
            'total_study_hours': round(total_study_time, 2),
            'this_week_study_hours': round(this_week_study, 2),
            'average_event_duration': round(
                sum((e.end_time - e.start_time).total_seconds() / 60 for e in all_events) / len(all_events)
            ) if all_events else 0
        }
    
    def export_calendar(self, filename: str, start_date: date, end_date: date):
        """Export calendar events to ICS format"""
        try:
            with open(filename, 'w') as f:
                f.write("BEGIN:VCALENDAR\n")
                f.write("VERSION:2.0\n")
                f.write("PRODID:-//Flow Study App//Calendar//EN\n")
                
                for event in self.events.values():
                    if start_date <= event.start_time.date() <= end_date:
                        f.write("BEGIN:VEVENT\n")
                        f.write(f"UID:{event.id}\n")
                        f.write(f"DTSTART:{event.start_time.strftime('%Y%m%dT%H%M%S')}\n")
                        f.write(f"DTEND:{event.end_time.strftime('%Y%m%dT%H%M%S')}\n")
                        f.write(f"SUMMARY:{event.title}\n")
                        f.write(f"DESCRIPTION:{event.description}\n")
                        if event.location:
                            f.write(f"LOCATION:{event.location}\n")
                        f.write("END:VEVENT\n")
                
                f.write("END:VCALENDAR\n")
            
            return True
        except Exception as e:
            print(f"Error exporting calendar: {e}")
            return False

class CalendarGUI:
    """Enhanced Calendar GUI with color-coded events"""
    
    def __init__(self, master, calendar_manager):
        self.master = master
        self.calendar_manager = calendar_manager
        self.current_date = date.today()
        
        self.setup_gui()
        self.refresh_calendar()
    
    def setup_gui(self):
        # Main frame
        main_frame = ttk.Frame(self.master)
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Navigation frame
        nav_frame = ttk.Frame(main_frame)
        nav_frame.pack(fill='x', pady=(0, 10))
        
        ttk.Button(nav_frame, text="<", command=self.prev_month).pack(side='left')
        self.month_label = ttk.Label(nav_frame, text="", font=('Arial', 16, 'bold'))
        self.month_label.pack(side='left', padx=20)
        ttk.Button(nav_frame, text=">", command=self.next_month).pack(side='left')
        
        # Add event frame
        add_frame = ttk.LabelFrame(main_frame, text="Quick Add Event", padding=10)
        add_frame.pack(fill='x', pady=(0, 10))
        
        # Event input fields
        input_frame = ttk.Frame(add_frame)
        input_frame.pack(fill='x')
        
        ttk.Label(input_frame, text="Title:").grid(row=0, column=0, sticky='w', padx=5)
        self.title_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.title_var, width=20).grid(row=0, column=1, padx=5)
        
        ttk.Label(input_frame, text="Date (MM/DD/YYYY):").grid(row=0, column=2, sticky='w', padx=5)
        self.date_var = tk.StringVar(value=self.current_date.strftime("%m/%d/%Y"))
        ttk.Entry(input_frame, textvariable=self.date_var, width=12).grid(row=0, column=3, padx=5)
        
        ttk.Label(input_frame, text="Time:").grid(row=1, column=0, sticky='w', padx=5)
        self.time_var = tk.StringVar(value="09:00")
        ttk.Entry(input_frame, textvariable=self.time_var, width=8).grid(row=1, column=1, padx=5)
        
        ttk.Label(input_frame, text="AM/PM:").grid(row=1, column=2, sticky='w', padx=5)
        self.ampm_var = tk.StringVar(value="AM")
        ttk.Combobox(input_frame, textvariable=self.ampm_var, values=["AM", "PM"], width=5).grid(row=1, column=3, padx=5)
        
        ttk.Label(input_frame, text="Type:").grid(row=0, column=4, sticky='w', padx=5)
        self.type_var = tk.StringVar(value="STUDY_SESSION")
        type_combo = ttk.Combobox(input_frame, textvariable=self.type_var, width=15)
        type_combo['values'] = [t.value for t in EventType]
        type_combo.grid(row=0, column=5, padx=5)
        
        ttk.Button(input_frame, text="Add Event", command=self.add_event).grid(row=1, column=5, padx=5, pady=5)
        
        # Calendar frame
        cal_frame = ttk.Frame(main_frame)
        cal_frame.pack(fill='both', expand=True)
        
        # Calendar grid
        self.calendar_frame = ttk.Frame(cal_frame)
        self.calendar_frame.pack(fill='both', expand=True)
        
        # Legend
        legend_frame = ttk.LabelFrame(main_frame, text="Event Type Colors", padding=10)
        legend_frame.pack(fill='x', pady=(10, 0))
        
        legend_inner = ttk.Frame(legend_frame)
        legend_inner.pack(fill='x')
        
        colors = {
            "Meeting": "#EF4444",
            "Study": "#10B981", 
            "Exam": "#F59E0B",
            "Personal": "#3B82F6",
            "Deadline": "#EF4444",
            "Assignment": "#F59E0B",
            "Class": "#8B5CF6",
            "Break": "#6B7280"
        }
        
        col = 0
        for event_type, color in colors.items():
            color_label = tk.Label(legend_inner, text="●", fg=color, font=('Arial', 16))
            color_label.grid(row=0, column=col*2, sticky='w')
            type_label = ttk.Label(legend_inner, text=event_type)
            type_label.grid(row=0, column=col*2+1, sticky='w', padx=(2, 15))
            col += 1
            if col >= 4:
                col = 0
        
    def prev_month(self):
        if self.current_date.month == 1:
            self.current_date = self.current_date.replace(year=self.current_date.year-1, month=12)
        else:
            self.current_date = self.current_date.replace(month=self.current_date.month-1)
        self.refresh_calendar()
    
    def next_month(self):
        if self.current_date.month == 12:
            self.current_date = self.current_date.replace(year=self.current_date.year+1, month=1)
        else:
            self.current_date = self.current_date.replace(month=self.current_date.month+1)
        self.refresh_calendar()
    
    def refresh_calendar(self):
        # Clear existing widgets
        for widget in self.calendar_frame.winfo_children():
            widget.destroy()
        
        # Update month label
        self.month_label.config(text=self.current_date.strftime("%B %Y"))
        
        # Create calendar grid
        cal = calendar.monthcalendar(self.current_date.year, self.current_date.month)
        
        # Days header
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for col, day in enumerate(days):
            header = ttk.Label(self.calendar_frame, text=day, font=('Arial', 12, 'bold'))
            header.grid(row=0, column=col, padx=2, pady=2, sticky='nsew')
        
        # Calendar days
        for row_num, week in enumerate(cal, 1):
            for col_num, day in enumerate(week):
                if day == 0:
                    continue
                
                # Create day frame
                day_frame = tk.Frame(self.calendar_frame, relief='solid', borderwidth=1, 
                                   bg='white', width=120, height=100)
                day_frame.grid(row=row_num, column=col_num, padx=1, pady=1, sticky='nsew')
                day_frame.grid_propagate(False)
                
                # Day number
                day_label = tk.Label(day_frame, text=str(day), font=('Arial', 10, 'bold'), 
                                   bg='white', anchor='nw')
                day_label.place(x=2, y=2)
                
                # Get events for this day
                current_day = date(self.current_date.year, self.current_date.month, day)
                day_events = self.calendar_manager.get_events_for_date(current_day)
                
                # Display events (max 4 visible)
                y_offset = 20
                for i, event in enumerate(day_events[:4]):
                    if i >= 3 and len(day_events) > 4:
                        more_label = tk.Label(day_frame, text=f"+{len(day_events)-3} more", 
                                            font=('Arial', 8), bg='white', fg='gray')
                        more_label.place(x=2, y=y_offset)
                        break
                    
                    # Event color dot and text
                    color = self.calendar_manager.event_colors.get(event.event_type, "#3B82F6")
                    
                    event_frame = tk.Frame(day_frame, bg='white')
                    event_frame.place(x=2, y=y_offset, width=115, height=15)
                    
                    dot = tk.Label(event_frame, text="●", fg=color, bg='white', font=('Arial', 8))
                    dot.pack(side='left')
                    
                    time_str = event.start_time.strftime("%H:%M")
                    event_text = f"{time_str} {event.title}"
                    if len(event_text) > 15:
                        event_text = event_text[:12] + "..."
                    
                    event_label = tk.Label(event_frame, text=event_text, 
                                         font=('Arial', 8), bg='white', anchor='w')
                    event_label.pack(side='left', fill='x', expand=True)
                    
                    y_offset += 15
        
        # Configure grid weights
        for i in range(7):
            self.calendar_frame.grid_columnconfigure(i, weight=1)
        for i in range(len(cal) + 1):
            self.calendar_frame.grid_rowconfigure(i, weight=1)
    
    def add_event(self):
        """Add a new event using the calendar GUI"""
        title = self.title_var.get().strip()
        if not title:
            messagebox.showwarning("Invalid Input", "Please enter an event title")
            return
        
        try:
            # Parse inputs
            date_str = self.date_var.get().strip()
            time_str = self.time_var.get().strip()
            am_pm = self.ampm_var.get().strip()
            event_type = EventType(self.type_var.get())
            
            # Create event using calendar manager
            event = self.calendar_manager.create_event_with_time_input(
                title=title,
                date_str=date_str,
                time_str=time_str,
                duration_minutes=60,
                event_type=event_type,
                am_pm=am_pm
            )
            
            if event:
                # Clear inputs
                self.title_var.set("")
                self.time_var.set("09:00")
                self.ampm_var.set("AM")
                
                # Refresh calendar
                self.refresh_calendar()
                messagebox.showinfo("Success", "Event added successfully!")
            else:
                messagebox.showerror("Error", "Failed to create event")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to add event: {str(e)}")

# Example usage and testing
if __name__ == "__main__":
    root = tk.Tk()
    root.title("Flow State Calendar")
    root.geometry("900x700")
    
    # Initialize calendar manager
    cm = CalendarManager()
    
    # Create calendar GUI
    cal_gui = CalendarGUI(root, cm)
    
    root.mainloop()
