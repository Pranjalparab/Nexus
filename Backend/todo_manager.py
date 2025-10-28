#!/usr/bin/env python3
"""
Advanced todo list manager with flow state optimization
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskCategory(Enum):
    STUDY = "study"
    RESEARCH = "research"
    ASSIGNMENT = "assignment"
    EXAM_PREP = "exam_prep"
    PROJECT = "project"
    READING = "reading"
    PRACTICE = "practice"
    OTHER = "other"

@dataclass
class Task:
    id: str
    title: str
    description: str
    priority: Priority
    status: TaskStatus
    category: TaskCategory
    estimated_time: int  # in minutes
    actual_time: int = 0  # in minutes
    created_at: datetime = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    tags: List[str] = None
    subtasks: List[str] = None  # List of subtask IDs
    parent_task: Optional[str] = None
    difficulty_level: int = 3  # 1-5 scale
    energy_required: int = 3  # 1-5 scale
    focus_required: int = 3  # 1-5 scale
    notes: str = ""
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.tags is None:
            self.tags = []
        if self.subtasks is None:
            self.subtasks = []

class FlowStateOptimizer:
    """Optimizes task scheduling based on flow state principles"""
    
    def __init__(self):
        self.flow_patterns = {
            'morning': {'energy': 4, 'focus': 5, 'creativity': 4},
            'afternoon': {'energy': 3, 'focus': 4, 'creativity': 3},
            'evening': {'energy': 2, 'focus': 3, 'creativity': 4}
        }
    
    def calculate_task_score(self, task: Task, current_time: datetime, 
                           user_energy: int, user_focus: int) -> float:
        """Calculate how well a task fits current conditions"""
        score = 0.0
        
        # Priority weight (30%)
        priority_weight = task.priority.value / 4.0
        score += priority_weight * 0.3
        
        # Due date urgency (25%)
        if task.due_date:
            days_until_due = (task.due_date - current_time).days
            if days_until_due <= 0:
                urgency_weight = 1.0  # Overdue
            elif days_until_due <= 1:
                urgency_weight = 0.9  # Due today/tomorrow
            elif days_until_due <= 7:
                urgency_weight = 0.7  # Due this week
            else:
                urgency_weight = 0.3  # Due later
            score += urgency_weight * 0.25
        else:
            score += 0.1  # Small penalty for no due date
        
        # Energy match (20%)
        energy_match = 1 - abs(task.energy_required - user_energy) / 4.0
        score += energy_match * 0.2
        
        # Focus match (20%)
        focus_match = 1 - abs(task.focus_required - user_focus) / 4.0
        score += focus_match * 0.2
        
        # Time fit (5%)
        if task.estimated_time <= 25:  # Pomodoro-sized
            time_bonus = 0.05
        elif task.estimated_time <= 50:  # Double pomodoro
            time_bonus = 0.03
        else:
            time_bonus = 0.01
        score += time_bonus
        
        return min(score, 1.0)
    
    def suggest_optimal_tasks(self, tasks: List[Task], current_time: datetime,
                            user_energy: int = 3, user_focus: int = 3,
                            available_time: int = 25) -> List[Tuple[Task, float]]:
        """Suggest optimal tasks for current conditions"""
        pending_tasks = [t for t in tasks if t.status == TaskStatus.PENDING]
        
        # Filter by available time
        suitable_tasks = [t for t in pending_tasks if t.estimated_time <= available_time]
        
        # Calculate scores
        scored_tasks = []
        for task in suitable_tasks:
            score = self.calculate_task_score(task, current_time, user_energy, user_focus)
            scored_tasks.append((task, score))
        
        # Sort by score (descending)
        scored_tasks.sort(key=lambda x: x[1], reverse=True)
        
        return scored_tasks[:5]  # Return top 5 suggestions

class TaskManager:
    """Advanced task management with flow state optimization"""
    
    def __init__(self, data_file: str = "tasks.json"):
        self.data_file = data_file
        self.tasks: Dict[str, Task] = {}
        self.optimizer = FlowStateOptimizer()
        self.load_tasks()
    
    def load_tasks(self):
        """Load tasks from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for task_data in data.get('tasks', []):
                        task = self._dict_to_task(task_data)
                        self.tasks[task.id] = task
            except Exception as e:
                print(f"Error loading tasks: {e}")
    
    def save_tasks(self):
        """Save tasks to file"""
        try:
            data = {
                'tasks': [self._task_to_dict(task) for task in self.tasks.values()],
                'last_updated': datetime.now().isoformat()
            }
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving tasks: {e}")
    
    def _task_to_dict(self, task: Task) -> dict:
        """Convert task to dictionary for JSON serialization"""
        task_dict = asdict(task)
        task_dict['priority'] = task.priority.value
        task_dict['status'] = task.status.value
        task_dict['category'] = task.category.value
        task_dict['created_at'] = task.created_at.isoformat()
        if task.due_date:
            task_dict['due_date'] = task.due_date.isoformat()
        if task.completed_at:
            task_dict['completed_at'] = task.completed_at.isoformat()
        return task_dict
    
    def _dict_to_task(self, task_dict: dict) -> Task:
        """Convert dictionary to task object"""
        task_dict = task_dict.copy()
        task_dict['priority'] = Priority(task_dict['priority'])
        task_dict['status'] = TaskStatus(task_dict['status'])
        task_dict['category'] = TaskCategory(task_dict['category'])
        task_dict['created_at'] = datetime.fromisoformat(task_dict['created_at'])
        if task_dict.get('due_date'):
            task_dict['due_date'] = datetime.fromisoformat(task_dict['due_date'])
        if task_dict.get('completed_at'):
            task_dict['completed_at'] = datetime.fromisoformat(task_dict['completed_at'])
        return Task(**task_dict)
    
    def create_task(self, title: str, description: str = "", 
                   priority: Priority = Priority.MEDIUM,
                   category: TaskCategory = TaskCategory.STUDY,
                   estimated_time: int = 25, due_date: Optional[datetime] = None,
                   tags: List[str] = None, difficulty_level: int = 3,
                   energy_required: int = 3, focus_required: int = 3) -> Task:
        """Create a new task"""
        task = Task(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            priority=priority,
            status=TaskStatus.PENDING,
            category=category,
            estimated_time=estimated_time,
            due_date=due_date,
            tags=tags or [],
            difficulty_level=difficulty_level,
            energy_required=energy_required,
            focus_required=focus_required
        )
        
        self.tasks[task.id] = task
        self.save_tasks()
        return task
    
    def update_task(self, task_id: str, **kwargs) -> bool:
        """Update an existing task"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        for key, value in kwargs.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        self.save_tasks()
        return True
    
    def complete_task(self, task_id: str, actual_time: int = None) -> bool:
        """Mark a task as completed"""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now()
        if actual_time:
            task.actual_time = actual_time
        
        self.save_tasks()
        return True
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            self.save_tasks()
            return True
        return False
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a specific task"""
        return self.tasks.get(task_id)
    
    def get_tasks(self, status: Optional[TaskStatus] = None,
                  category: Optional[TaskCategory] = None,
                  priority: Optional[Priority] = None) -> List[Task]:
        """Get tasks with optional filtering"""
        tasks = list(self.tasks.values())
        
        if status:
            tasks = [t for t in tasks if t.status == status]
        if category:
            tasks = [t for t in tasks if t.category == category]
        if priority:
            tasks = [t for t in tasks if t.priority == priority]
        
        return tasks
    
    def get_overdue_tasks(self) -> List[Task]:
        """Get overdue tasks"""
        now = datetime.now()
        return [t for t in self.tasks.values() 
                if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED]
    
    def get_due_today(self) -> List[Task]:
        """Get tasks due today"""
        today = datetime.now().date()
        return [t for t in self.tasks.values()
                if t.due_date and t.due_date.date() == today and t.status != TaskStatus.COMPLETED]
    
    def get_upcoming_tasks(self, days: int = 7) -> List[Task]:
        """Get tasks due in the next N days"""
        now = datetime.now()
        future = now + timedelta(days=days)
        return [t for t in self.tasks.values()
                if t.due_date and now <= t.due_date <= future and t.status != TaskStatus.COMPLETED]
    
    def suggest_next_task(self, user_energy: int = 3, user_focus: int = 3,
                         available_time: int = 25) -> Optional[Tuple[Task, float]]:
        """Suggest the next best task to work on"""
        suggestions = self.optimizer.suggest_optimal_tasks(
            list(self.tasks.values()), datetime.now(), 
            user_energy, user_focus, available_time
        )
        return suggestions[0] if suggestions else None
    
    def get_task_statistics(self) -> dict:
        """Get task statistics"""
        all_tasks = list(self.tasks.values())
        completed_tasks = [t for t in all_tasks if t.status == TaskStatus.COMPLETED]
        
        stats = {
            'total_tasks': len(all_tasks),
            'completed_tasks': len(completed_tasks),
            'pending_tasks': len([t for t in all_tasks if t.status == TaskStatus.PENDING]),
            'in_progress_tasks': len([t for t in all_tasks if t.status == TaskStatus.IN_PROGRESS]),
            'overdue_tasks': len(self.get_overdue_tasks()),
            'completion_rate': len(completed_tasks) / len(all_tasks) * 100 if all_tasks else 0
        }
        
        if completed_tasks:
            estimated_times = [t.estimated_time for t in completed_tasks if t.estimated_time > 0]
            actual_times = [t.actual_time for t in completed_tasks if t.actual_time > 0]
            
            if estimated_times:
                stats['avg_estimated_time'] = sum(estimated_times) / len(estimated_times)
            if actual_times:
                stats['avg_actual_time'] = sum(actual_times) / len(actual_times)
                if estimated_times and len(actual_times) == len(estimated_times):
                    accuracy = sum(abs(e - a) for e, a in zip(estimated_times, actual_times))
                    stats['time_estimation_accuracy'] = max(0, 100 - (accuracy / len(actual_times)))
        
        return stats
    
    def create_subtask(self, parent_task_id: str, title: str, **kwargs) -> Optional[Task]:
        """Create a subtask"""
        if parent_task_id not in self.tasks:
            return None
        
        subtask = self.create_task(title, **kwargs)
        subtask.parent_task = parent_task_id
        
        # Add to parent's subtasks list
        parent_task = self.tasks[parent_task_id]
        parent_task.subtasks.append(subtask.id)
        
        self.save_tasks()
        return subtask
    
    def get_subtasks(self, parent_task_id: str) -> List[Task]:
        """Get all subtasks of a parent task"""
        if parent_task_id not in self.tasks:
            return []
        
        parent_task = self.tasks[parent_task_id]
        return [self.tasks[subtask_id] for subtask_id in parent_task.subtasks 
                if subtask_id in self.tasks]
    
    def export_tasks(self, filename: str, format: str = 'json'):
        """Export tasks to file"""
        if format.lower() == 'json':
            with open(filename, 'w') as f:
                json.dump([self._task_to_dict(task) for task in self.tasks.values()], 
                         f, indent=2)
        elif format.lower() == 'csv':
            import csv
            with open(filename, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['ID', 'Title', 'Description', 'Priority', 'Status', 
                               'Category', 'Estimated Time', 'Due Date', 'Created At'])
                for task in self.tasks.values():
                    writer.writerow([
                        task.id, task.title, task.description, task.priority.name,
                        task.status.value, task.category.value, task.estimated_time,
                        task.due_date.isoformat() if task.due_date else '',
                        task.created_at.isoformat()
                    ])

class PomodoroIntegration:
    """Integration between task management and Pomodoro technique"""
    
    def __init__(self, task_manager: TaskManager):
        self.task_manager = task_manager
        self.current_task_id = None
        self.session_start_time = None
        self.completed_pomodoros = {}  # task_id -> count
    
    def start_pomodoro(self, task_id: str):
        """Start a Pomodoro session for a task"""
        if task_id in self.task_manager.tasks:
            self.current_task_id = task_id
            self.session_start_time = datetime.now()
            
            # Update task status
            self.task_manager.update_task(task_id, status=TaskStatus.IN_PROGRESS)
            
            return True
        return False
    
    def complete_pomodoro(self, quality_rating: int = 5):
        """Complete a Pomodoro session"""
        if not self.current_task_id or not self.session_start_time:
            return False
        
        # Calculate session duration
        session_duration = (datetime.now() - self.session_start_time).total_seconds() / 60
        
        # Update task actual time
        task = self.task_manager.get_task(self.current_task_id)
        if task:
            new_actual_time = task.actual_time + int(session_duration)
            self.task_manager.update_task(self.current_task_id, actual_time=new_actual_time)
        
        # Track completed pomodoros
        if self.current_task_id not in self.completed_pomodoros:
            self.completed_pomodoros[self.current_task_id] = 0
        self.completed_pomodoros[self.current_task_id] += 1
        
        # Reset session
        self.current_task_id = None
        self.session_start_time = None
        
        return True
    
    def get_task_pomodoros(self, task_id: str) -> int:
        """Get number of completed pomodoros for a task"""
        return self.completed_pomodoros.get(task_id, 0)
    
    def estimate_remaining_pomodoros(self, task_id: str) -> int:
        """Estimate remaining pomodoros needed for a task"""
        task = self.task_manager.get_task(task_id)
        if not task:
            return 0
        
        remaining_time = max(0, task.estimated_time - task.actual_time)
        return max(1, remaining_time // 25)  # 25 minutes per pomodoro

# Example usage and testing
if __name__ == "__main__":
    # Create task manager
    tm = TaskManager("test_tasks.json")
    
    # Create some sample tasks
    task1 = tm.create_task(
        "Study Python Advanced Concepts",
        "Review decorators, generators, and context managers",
        Priority.HIGH,
        TaskCategory.STUDY,
        estimated_time=50,
        due_date=datetime.now() + timedelta(days=2),
        tags=["python", "programming"],
        difficulty_level=4,
        energy_required=4,
        focus_required=5
    )
    
    task2 = tm.create_task(
        "Read Research Paper",
        "Read and summarize the latest ML research paper",
        Priority.MEDIUM,
        TaskCategory.RESEARCH,
        estimated_time=75,
        due_date=datetime.now() + timedelta(days=5),
        tags=["research", "ml"],
        difficulty_level=3,
        energy_required=3,
        focus_required=4
    )
    
    # Get task suggestions
    suggestion = tm.suggest_next_task(user_energy=4, user_focus=5, available_time=60)
    if suggestion:
        task, score = suggestion
        print(f"Suggested task: {task.title} (Score: {score:.2f})")
    
    # Get statistics
    stats = tm.get_task_statistics()
    print(f"Task Statistics: {stats}")
    
    # Test Pomodoro integration
    pomodoro = PomodoroIntegration(tm)
    pomodoro.start_pomodoro(task1.id)
    print(f"Started Pomodoro for: {task1.title}")