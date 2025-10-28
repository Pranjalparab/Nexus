#!/usr/bin/env python3
"""
Main runner script for the Flow State Study Companion
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_dependencies():
    """Check if required dependencies are available"""
    missing_deps = []
    
    try:
        import tkinter
    except ImportError:
        missing_deps.append("tkinter")
    
    try:
        import cv2
    except ImportError:
        print("Warning: OpenCV (cv2) not found. Camera features will be disabled.")
    
    try:
        import PIL
    except ImportError:
        print("Warning: PIL/Pillow not found. Image display may not work properly.")
    
    try:
        import numpy
    except ImportError:
        missing_deps.append("numpy")
    
    if missing_deps:
        print(f"Error: Missing required dependencies: {', '.join(missing_deps)}")
        print("Please install them using:")
        print(f"pip install {' '.join(missing_deps)}")
        return False
    
    return True

def main():
    """Main function"""
    print("Flow State Study Companion")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    try:
        from flow_study_app import main as app_main
        
        print("Starting Flow State Study Companion...")
        print("Features available:")
        print("- Pomodoro Timer with Flow State Optimization")
        print("- Task Management with Priority Scheduling")
        print("- Calendar Integration")
        
        try:
            import cv2
            print("- Camera-based Focus Tracking")
        except ImportError:
            print("- Camera features disabled (OpenCV not available)")
        
        print("\nPress Ctrl+C to exit the application.")
        print("=" * 40)
        
        app_main()
        
    except ImportError as e:
        print(f"Error importing application modules: {e}")
        print("Please ensure all Python files are in the same directory.")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nApplication closed by user.")
        sys.exit(0)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        print("Please check the error details above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()