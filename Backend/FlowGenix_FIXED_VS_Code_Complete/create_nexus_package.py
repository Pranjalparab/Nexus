"""
Create NEXUS Package - FlowGenix Complete System
Creates a zip file containing the integrated UI and app blocker system
"""

import zipfile
import os
from pathlib import Path
import shutil

def create_nexus_package():
    """Create the NEXUS zip package"""
    
    print("🚀 Creating NEXUS Package...")
    print("=" * 50)
    
    # Define the package path
    current_dir = Path.cwd()
    package_path = current_dir.parent / "nexus.zip"
    
    # Files and directories to include
    include_patterns = [
        # React app files
        "src/",
        "public/",
        "package.json",
        "tailwind.config.js",
        "postcss.config.js",
        
        # Python blocker files
        "comprehensive_app_blocker.py",
        "app_blocker_bridge.py",
        "launch_nexus.py",
        
        # Documentation
        "README_NEXUS.md",
        "requirements.txt",
        
        # Styles and assets
        "styles/",
        "js/",
        
        # Other project files
        "index.html",
        "flowgenix-standalone.html",
        "flowgenix-colorful.html",
    ]
    
    # Files to exclude
    exclude_patterns = [
        "node_modules/",
        ".git/",
        "__pycache__/",
        "*.pyc",
        ".env",
        "build/",
        "dist/",
        "*.log",
    ]
    
    try:
        # Remove existing package if it exists
        if package_path.exists():
            package_path.unlink()
            print(f"🗑️ Removed existing package: {package_path}")
        
        # Create zip file
        with zipfile.ZipFile(package_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            
            # Add all relevant files
            for root, dirs, files in os.walk(current_dir):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if not any(d.startswith(exclude.rstrip('/')) for exclude in exclude_patterns)]
                
                for file in files:
                    file_path = Path(root) / file
                    relative_path = file_path.relative_to(current_dir)
                    
                    # Skip excluded files
                    if any(str(relative_path).startswith(exclude.rstrip('/')) for exclude in exclude_patterns):
                        continue
                    
                    # Skip files that don't match include patterns (if they're specified)
                    if include_patterns:
                        should_include = False
                        for pattern in include_patterns:
                            if (pattern.endswith('/') and str(relative_path).startswith(pattern)) or \
                               (not pattern.endswith('/') and str(relative_path) == pattern) or \
                               str(relative_path).startswith(pattern.split('/')[0] + '/'):
                                should_include = True
                                break
                        
                        if not should_include:
                            continue
                    
                    # Add file to zip
                    zipf.write(file_path, f"nexus/{relative_path}")
                    print(f"📁 Added: {relative_path}")
        
        # Get package size
        size_mb = package_path.stat().st_size / (1024 * 1024)
        
        print("=" * 50)
        print(f"✅ NEXUS Package Created Successfully!")
        print(f"📦 Package Location: {package_path}")
        print(f"📊 Package Size: {size_mb:.2f} MB")
        print("=" * 50)
        print()
        print("🎯 What's in NEXUS:")
        print("   🌐 React UI with 4 animated themes")
        print("   🛡️ Comprehensive Windows app blocker")
        print("   🔄 Seamless integration between UI and blocker")
        print("   🚀 Single-command launcher")
        print("   📚 Complete documentation")
        print()
        print("🚀 To use NEXUS:")
        print("   1. Extract nexus.zip to a folder")
        print("   2. Open terminal in that folder")
        print("   3. Run: python launch_nexus.py")
        print("   4. Enjoy ultimate focus productivity!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating NEXUS package: {e}")
        return False

if __name__ == "__main__":
    create_nexus_package()
