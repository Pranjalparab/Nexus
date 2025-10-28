#!/usr/bin/env python3
"""
Camera utilities for focus tracking and analysis
"""

import cv2
import numpy as np
from datetime import datetime
import os
from typing import List, Tuple, Optional
import json

class FocusAnalyzer:
    """Analyzes camera frames to detect focus and attention levels"""
    
    def __init__(self):
        # Load face detection classifier
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
            
            # Check if cascade files exist
            import os
            if not os.path.exists(cascade_path) or not os.path.exists(eye_cascade_path):
                print("Warning: OpenCV cascade files not found. Face detection may not work.")
                self.face_cascade = None
                self.eye_cascade = None
            else:
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
                
                # Test if cascades loaded properly
                if self.face_cascade.empty() or self.eye_cascade.empty():
                    print("Warning: Failed to load cascade classifiers properly")
                    self.face_cascade = None
                    self.eye_cascade = None
                else:
                    print("Face detection classifiers loaded successfully")
                    
        except Exception as e:
            print(f"Warning: Could not load OpenCV cascades: {e}")
            self.face_cascade = None
            self.eye_cascade = None
        
        # Focus tracking variables
        self.focus_history = []
        self.attention_threshold = 0.7
        
        # Focus monitoring for timer control
        self.unfocused_frames = 0
        self.unfocused_threshold = 60  # frames before considering user unfocused (increased for less sensitivity)
        self.focus_callbacks = []  # callbacks for focus state changes
        
        # Debugging flags
        self.debug_enabled = True
        
    def detect_face_and_eyes(self, frame: np.ndarray) -> Tuple[List, List]:
        """Detect faces and eyes in the frame"""
        if self.face_cascade is None or self.eye_cascade is None:
            return [], []
            
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            # Detect eyes
            eyes = []
            for (x, y, w, h) in faces:
                roi_gray = gray[y:y+h, x:x+w]
                detected_eyes = self.eye_cascade.detectMultiScale(roi_gray)
                # Adjust eye coordinates to full frame
                for (ex, ey, ew, eh) in detected_eyes:
                    eyes.append((x+ex, y+ey, ew, eh))
            
            return list(faces), eyes
        except Exception as e:
            print(f"Error in face/eye detection: {e}")
            return [], []
    
    def calculate_focus_score(self, faces: List, eyes: List, frame_shape: Tuple) -> float:
        """Calculate focus score based on face and eye detection"""
        if not faces:
            return 0.0
        
        # Base score for face detection (increased to make detection more forgiving)
        focus_score = 0.6
        
        # Bonus for eye detection (more lenient - even one eye is good)
        if len(eyes) >= 2:
            focus_score += 0.25
        elif len(eyes) == 1:
            focus_score += 0.2
        
        # Check if face is centered and appropriately sized
        face = faces[0]  # Use the first (largest) face
        x, y, w, h = face
        frame_height, frame_width = frame_shape[:2]
        
        # Face size score (closer to ideal size is better)
        face_area = w * h
        frame_area = frame_width * frame_height
        face_ratio = face_area / frame_area
        
        # Ideal face should be 5-25% of frame
        if 0.05 <= face_ratio <= 0.25:
            size_score = 0.15
        elif 0.02 <= face_ratio <= 0.35:  # Still acceptable
            size_score = 0.1
        else:
            size_score = 0.05  # Too small or too large
        
        focus_score += size_score
        
        return min(focus_score, 1.0)
    
    def add_focus_callback(self, callback):
        """Add callback for focus state changes"""
        self.focus_callbacks.append(callback)
    
    def check_focus_status(self, is_focused: bool):
        """Check focus status and trigger callbacks if needed"""
        if not is_focused:
            self.unfocused_frames += 1
            # Print debug info to help troubleshoot
            if self.unfocused_frames % 10 == 0:  # Print every 10 unfocused frames
                print(f"User unfocused for {self.unfocused_frames} frames (threshold: {self.unfocused_threshold})")
                
            if self.unfocused_frames >= self.unfocused_threshold:
                # User has been unfocused for too long
                print("Focus lost threshold reached - triggering callbacks")
                for callback in self.focus_callbacks:
                    try:
                        callback('focus_lost')
                    except Exception as e:
                        print(f"Error in focus callback: {e}")
                self.unfocused_frames = 0  # Reset counter
        else:
            if self.unfocused_frames > 0:
                print(f"User refocused after {self.unfocused_frames} unfocused frames")
            self.unfocused_frames = 0  # Reset if user is focused
    
    def analyze_frame(self, frame: np.ndarray) -> dict:
        """Analyze a frame for focus indicators"""
        faces, eyes = self.detect_face_and_eyes(frame)
        focus_score = self.calculate_focus_score(faces, eyes, frame.shape)
        
        # Update focus history
        self.focus_history.append(focus_score)
        if len(self.focus_history) > 30:  # Keep last 30 frames for faster response
            self.focus_history.pop(0)
        
        # Calculate average focus over recent frames
        avg_focus = np.mean(self.focus_history) if self.focus_history else 0
        is_focused = avg_focus > self.attention_threshold
        
        # Debug output
        if self.debug_enabled and len(self.focus_history) % 30 == 0:  # Every 30 frames
            print(f"Focus Analysis - Faces: {len(faces)}, Eyes: {len(eyes)}, Score: {focus_score:.2f}, Avg: {avg_focus:.2f}, Focused: {is_focused}")
        
        # Check focus status for timer control
        self.check_focus_status(is_focused)
        
        return {
            'faces_detected': len(faces),
            'eyes_detected': len(eyes),
            'focus_score': focus_score,
            'average_focus': avg_focus,
            'is_focused': is_focused,
            'faces': faces,
            'eyes': eyes
        }
    
    def draw_analysis_overlay(self, frame: np.ndarray, analysis: dict) -> np.ndarray:
        """Draw analysis overlay on the frame"""
        overlay_frame = frame.copy()
        
        # Draw face rectangles
        for (x, y, w, h) in analysis['faces']:
            color = (0, 255, 0) if analysis['is_focused'] else (255, 255, 0)
            cv2.rectangle(overlay_frame, (x, y), (x+w, y+h), color, 2)
        
        # Draw eye rectangles
        for (x, y, w, h) in analysis['eyes']:
            cv2.rectangle(overlay_frame, (x, y), (x+w, y+h), (0, 0, 255), 1)
        
        # Draw focus score
        focus_text = f"Focus: {analysis['focus_score']:.2f}"
        cv2.putText(overlay_frame, focus_text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Draw focus status
        status_text = "FOCUSED" if analysis['is_focused'] else "DISTRACTED"
        status_color = (0, 255, 0) if analysis['is_focused'] else (0, 0, 255)
        cv2.putText(overlay_frame, status_text, (10, 70), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
        
        return overlay_frame

class SessionRecorder:
    """Records study sessions with camera data"""
    
    def __init__(self, output_dir: str = "session_recordings"):
        self.output_dir = output_dir
        self.is_recording = False
        self.video_writer = None
        self.session_data = []
        self.video_filepath = None
        self.fps = 10
        
        # Create output directory
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def start_recording(self, session_id: str, fps: int = 10):
        """Start recording a study session"""
        if self.is_recording:
            return False
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{session_id}_{timestamp}.avi"
        filepath = os.path.join(self.output_dir, filename)
        
        # Initialize video writer (will be set up when first frame is received)
        self.video_filepath = filepath
        self.fps = fps
        self.is_recording = True
        self.session_data = []
        
        return True
    
    def add_frame(self, frame: np.ndarray, analysis_data: dict):
        """Add a frame to the recording"""
        if not self.is_recording:
            return
        
        try:
            # Initialize video writer on first frame
            if self.video_writer is None:
                height, width = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*'XVID')
                self.video_writer = cv2.VideoWriter(
                    self.video_filepath, fourcc, self.fps, (width, height)
                )
            
            # Convert RGB to BGR for video writing
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            self.video_writer.write(bgr_frame)
            
            # Store analysis data
            self.session_data.append({
                'timestamp': datetime.now().isoformat(),
                'focus_score': analysis_data.get('focus_score', 0),
                'faces_detected': analysis_data.get('faces_detected', 0),
                'eyes_detected': analysis_data.get('eyes_detected', 0)
            })
        except Exception as e:
            print(f"Error adding frame to recording: {e}")
    
    def stop_recording(self) -> Optional[str]:
        """Stop recording and save session data"""
        if not self.is_recording:
            return None
        
        self.is_recording = False
        
        if self.video_writer:
            self.video_writer.release()
            self.video_writer = None
        
        # Save session analysis data
        if self.session_data and self.video_filepath:
            data_filename = self.video_filepath.replace('.avi', '_analysis.json')
            try:
                with open(data_filename, 'w') as f:
                    json.dump(self.session_data, f, indent=2)
            except Exception as e:
                print(f"Error saving session data: {e}")
        
        return self.video_filepath

class PostureAnalyzer:
    """Analyzes posture from camera feed"""
    
    def __init__(self):
        self.good_posture_threshold = 0.8
        self.posture_history = []
    
    def analyze_posture(self, faces: List) -> dict:
        """Analyze posture based on face position and size"""
        if not faces:
            return {
                'posture_score': 0.0,
                'posture_status': 'No face detected',
                'recommendations': ['Ensure you are visible to the camera']
            }
        
        face = faces[0]  # Use the first face
        x, y, w, h = face
        
        # Analyze face size (distance from camera)
        face_area = w * h
        ideal_area_range = (5000, 15000)  # Adjust based on camera resolution
        
        if face_area < ideal_area_range[0]:
            distance_score = 0.3  # Too far
            distance_msg = "Move closer to camera"
        elif face_area > ideal_area_range[1]:
            distance_score = 0.5  # Too close
            distance_msg = "Move back from camera"
        else:
            distance_score = 1.0  # Good distance
            distance_msg = "Good distance"
        
        # Analyze face position (should be in upper portion of frame)
        face_center_y = y + h // 2
        if face_center_y < 200:  # Adjust based on resolution
            position_score = 1.0
            position_msg = "Good head position"
        else:
            position_score = 0.6
            position_msg = "Sit up straighter"
        
        # Calculate overall posture score
        posture_score = (distance_score + position_score) / 2
        
        # Update history
        self.posture_history.append(posture_score)
        if len(self.posture_history) > 50:
            self.posture_history.pop(0)
        
        avg_posture = np.mean(self.posture_history) if self.posture_history else posture_score
        
        # Generate recommendations
        recommendations = []
        if distance_score < 0.8:
            recommendations.append(distance_msg)
        if position_score < 0.8:
            recommendations.append(position_msg)
        if not recommendations:
            recommendations.append("Maintain good posture!")
        
        return {
            'posture_score': posture_score,
            'average_posture': avg_posture,
            'posture_status': 'Good' if avg_posture > self.good_posture_threshold else 'Needs improvement',
            'recommendations': recommendations
        }

class CameraManager:
    """Manages camera functionality for the application - AUTO-STARTS CAMERA"""
    
    def __init__(self):
        self.camera = None
        self.is_active = False
        self.snapshots = []
        self.snapshot_dir = "study_snapshots"
        self.focus_analyzer = FocusAnalyzer()
        self.posture_analyzer = PostureAnalyzer()
        self.session_recorder = SessionRecorder()
        
        # Create snapshots directory
        if not os.path.exists(self.snapshot_dir):
            os.makedirs(self.snapshot_dir)
        
        # AUTOMATICALLY START CAMERA ON INITIALIZATION
        print("Auto-starting camera...")
        self.auto_start_camera()
    
    def add_focus_callback(self, callback):
        """Add callback for focus state changes"""
        self.focus_analyzer.add_focus_callback(callback)
    
    def auto_start_camera(self):
        """Automatically start camera on initialization"""
        try:
            print("Attempting to auto-start camera...")
            success = self.start_camera()
            if success:
                print("✓ Camera auto-started successfully!")
            else:
                print("⚠ Camera auto-start failed - will try again later")
        except Exception as e:
            print(f"⚠ Error during camera auto-start: {e}")
    
    def start_camera(self):
        """Start camera capture"""
        try:
            # Release any existing camera resources first
            if self.camera is not None:
                self.camera.release()
            
            # Try to open camera with different backends
            for backend in [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]:
                try:
                    print(f"Trying camera backend: {backend}")
                    self.camera = cv2.VideoCapture(0, backend)
                    if self.camera.isOpened():
                        # Set camera properties for better performance
                        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        self.camera.set(cv2.CAP_PROP_FPS, 30)
                        
                        # Test if we can actually read a frame
                        ret, frame = self.camera.read()
                        if ret:
                            self.is_active = True
                            print(f"✓ Camera started successfully with backend: {backend}")
                            return True
                        else:
                            self.camera.release()
                            continue
                    else:
                        if self.camera is not None:
                            self.camera.release()
                        continue
                except Exception as backend_error:
                    print(f"Backend {backend} failed: {backend_error}")
                    continue
            
            print("Error: Could not access camera with any backend")
            self.is_active = False
            return False
            
        except Exception as e:
            print(f"Error starting camera: {str(e)}")
            self.is_active = False
            return False
    
    def stop_camera(self):
        """Stop camera capture"""
        if self.camera:
            self.camera.release()
            self.is_active = False
            print("Camera stopped")
    
    def get_frame(self):
        """Get current camera frame"""
        if self.camera and self.is_active:
            ret, frame = self.camera.read()
            if ret:
                return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return None
    
    def take_snapshot(self):
        """Take a snapshot and save it"""
        frame = self.get_frame()
        if frame is not None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"snapshot_{timestamp}.jpg"
            filepath = os.path.join(self.snapshot_dir, filename)
            
            try:
                # Convert RGB back to BGR for saving
                bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                cv2.imwrite(filepath, bgr_frame)
                
                self.snapshots.append(filepath)
                return filepath
            except Exception as e:
                print(f"Error saving snapshot: {e}")
                return None
        return None
    
    def analyze_current_frame(self):
        """Analyze current frame for focus and posture"""
        frame = self.get_frame()
        if frame is not None:
            # Analyze focus
            focus_analysis = self.focus_analyzer.analyze_frame(frame)
            
            # Analyze posture
            posture_analysis = self.posture_analyzer.analyze_posture(focus_analysis['faces'])
            
            return {
                'frame': frame,
                'focus': focus_analysis,
                'posture': posture_analysis
            }
        return None
    
    def start_session_recording(self, session_id: str):
        """Start recording a study session"""
        return self.session_recorder.start_recording(session_id)
    
    def stop_session_recording(self):
        """Stop recording a study session"""
        return self.session_recorder.stop_recording()
    
    def add_frame_to_recording(self, analysis_data: dict):
        """Add current frame to recording"""
        frame = self.get_frame()
        if frame is not None:
            self.session_recorder.add_frame(frame, analysis_data)

def create_focus_report(session_data: List[dict]) -> dict:
    """Create a focus report from session data"""
    if not session_data:
        return {'error': 'No session data available'}
    
    focus_scores = [d['focus_score'] for d in session_data]
    
    report = {
        'session_duration': len(session_data),  # Number of frames
        'average_focus': np.mean(focus_scores),
        'max_focus': np.max(focus_scores),
        'min_focus': np.min(focus_scores),
        'focus_consistency': 1 - np.std(focus_scores),  # Lower std = more consistent
        'focused_percentage': len([s for s in focus_scores if s > 0.7]) / len(focus_scores) * 100,
        'distraction_events': len([i for i in range(1, len(focus_scores)) 
                                 if focus_scores[i-1] > 0.7 and focus_scores[i] < 0.5])
    }
    
    # Generate insights
    insights = []
    if report['average_focus'] > 0.8:
        insights.append("Excellent focus throughout the session!")
    elif report['average_focus'] > 0.6:
        insights.append("Good focus with room for improvement.")
    else:
        insights.append("Consider minimizing distractions for better focus.")
    
    if report['focus_consistency'] > 0.8:
        insights.append("Very consistent attention levels.")
    elif report['focus_consistency'] > 0.6:
        insights.append("Moderately consistent focus.")
    else:
        insights.append("Focus levels varied significantly - try to maintain steady attention.")
    
    report['insights'] = insights
    
    return report

# Example usage
if __name__ == "__main__":
    # Test camera functionality
    camera_manager = CameraManager()  # Camera starts automatically now
    
    print("Camera manager initialized - camera should be running")
    
    # Take a snapshot
    snapshot_path = camera_manager.take_snapshot()
    if snapshot_path:
        print(f"Snapshot saved: {snapshot_path}")
    
    # Analyze current frame
    analysis = camera_manager.analyze_current_frame()
    if analysis:
        print(f"Focus score: {analysis['focus']['focus_score']:.2f}")
        print(f"Posture status: {analysis['posture']['posture_status']}")
    
    # Camera will stop automatically when the program ends