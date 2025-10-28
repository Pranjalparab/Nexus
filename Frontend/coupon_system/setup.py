#!/usr/bin/env python3
"""
Setup script for BTS & Anime Coupon System
Run this script to initialize the entire system
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_header(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def check_python_version():
    """Check if Python version is 3.7 or higher"""
    print_header("CHECKING PYTHON VERSION")
    
    if sys.version_info < (3, 7):
        print_error("Python 3.7 or higher is required!")
        print_info(f"Current version: {sys.version}")
        return False
    
    print_success(f"Python version: {sys.version}")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print_header("INSTALLING DEPENDENCIES")
    
    backend_path = Path("backend")
    requirements_file = backend_path / "requirements.txt"
    
    if not requirements_file.exists():
        print_error("requirements.txt not found!")
        return False
    
    try:
        print_info("Installing Python packages...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_success("Dependencies installed successfully!")
            return True
        else:
            print_error(f"Failed to install dependencies: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error installing dependencies: {e}")
        return False

def setup_environment():
    """Set up environment configuration"""
    print_header("SETTING UP ENVIRONMENT")
    
    backend_path = Path("backend")
    env_example = backend_path / ".env.example"
    env_file = backend_path / ".env"
    
    if env_file.exists():
        print_info(".env file already exists, skipping...")
        return True
    
    if not env_example.exists():
        print_error(".env.example not found!")
        return False
    
    try:
        shutil.copy(env_example, env_file)
        print_success("Environment file created!")
        print_info("You can modify backend/.env for custom configuration")
        return True
    except Exception as e:
        print_error(f"Error creating environment file: {e}")
        return False

def initialize_database():
    """Initialize database and populate sample data"""
    print_header("INITIALIZING DATABASE")
    
    backend_path = Path("backend")
    
    try:
        # Change to backend directory
        original_cwd = os.getcwd()
        os.chdir(backend_path)
        
        print_info("Populating database with sample data...")
        result = subprocess.run([
            sys.executable, "populate_sample_data.py"
        ], capture_output=True, text=True)
        
        # Return to original directory
        os.chdir(original_cwd)
        
        if result.returncode == 0:
            print_success("Database initialized with sample data!")
            print_info("Sample login credentials created:")
            print_info("  - Username: btsfan123, Password: password123")
            print_info("  - Username: animelover, Password: password123")
            print_info("  - Username: kpopaddict, Password: password123")
            return True
        else:
            print_error(f"Failed to initialize database: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error initializing database: {e}")
        return False

def create_run_scripts():
    """Create convenient run scripts"""
    print_header("CREATING RUN SCRIPTS")
    
    # Windows batch script
    if os.name == 'nt':
        batch_content = """@echo off
echo Starting BTS & Anime Coupon System Backend...
cd backend
python app.py
pause
"""
        with open("start_backend.bat", "w") as f:
            f.write(batch_content)
        print_success("Created start_backend.bat")
    
    # Unix shell script
    shell_content = """#!/bin/bash
echo "Starting BTS & Anime Coupon System Backend..."
cd backend
python3 app.py
"""
    with open("start_backend.sh", "w") as f:
        f.write(shell_content)
    
    # Make shell script executable on Unix systems
    if os.name != 'nt':
        os.chmod("start_backend.sh", 0o755)
        print_success("Created start_backend.sh")
    
    return True

def print_final_instructions():
    """Print final setup instructions"""
    print_header("SETUP COMPLETE! 🎉")
    
    print("Your BTS & Anime Coupon System is ready to use!")
    print()
    print("📋 NEXT STEPS:")
    print()
    print("1. 🚀 Start the backend server:")
    if os.name == 'nt':
        print("   - Double-click 'start_backend.bat'")
        print("   - Or run: cd backend && python app.py")
    else:
        print("   - Run: ./start_backend.sh")
        print("   - Or run: cd backend && python3 app.py")
    print()
    print("2. 🌐 Open the frontend demo:")
    print("   - Open 'frontend/index.html' in your web browser")
    print("   - For best experience, use Live Server extension in VS Code")
    print()
    print("3. 🎫 Test with sample data:")
    print("   - Login: btsfan123 / password123")
    print("   - Try coupon codes: BTS20OFF, ANIME15, FREESHIP")
    print()
    print("4. 📚 Read the documentation:")
    print("   - Check 'docs/README.md' for detailed information")
    print()
    print("🔗 API will be available at: http://localhost:5000/api")
    print("🔗 Health check: http://localhost:5000/api/health")
    print()
    print("Happy coding! 💜✨")

def main():
    """Main setup function"""
    print_header("BTS & ANIME COUPON SYSTEM SETUP")
    print("Setting up your themed coupon system...")
    
    steps = [
        ("Checking Python version", check_python_version),
        ("Installing dependencies", install_dependencies),
        ("Setting up environment", setup_environment),
        ("Initializing database", initialize_database),
        ("Creating run scripts", create_run_scripts),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print_error(f"Setup failed at: {step_name}")
            sys.exit(1)
    
    print_final_instructions()

if __name__ == "__main__":
    main()
