# 🚀 NEXUS - FlowGenix Complete System

**NEXUS** is the ultimate focus productivity solution that seamlessly integrates a beautiful React-based UI with comprehensive Windows app blocking capabilities. When you start a focus session, it doesn't just show a timer - it **actively blocks ALL distracting applications** to ensure maximum productivity.

## ✨ Key Features

### 🌐 Beautiful React UI
- **4 Animated Themes**: K-Pop, Anime, Car Racing, and Music Vibes
- **Real-time Timer**: Elegant circular progress with theme-specific animations
- **Camera Monitoring**: Optional webcam focus detection
- **Background Music**: Theme-matched ambient sounds
- **Focus Statistics**: Coins, sessions, total time tracking
- **Responsive Design**: Works on desktop and mobile browsers

### 🛡️ Comprehensive App Blocking
- **Real Windows API Integration**: Uses win32api for bulletproof app termination
- **Blocks 67+ Application Types**: Browsers, social media, games, entertainment, shopping
- **Instant Blocking**: 1-second monitoring intervals for maximum effectiveness
- **Smart Protection**: Never blocks essential system processes
- **Live Statistics**: Real-time blocked app counts
- **Automatic Integration**: Seamlessly works with the React timer

### 🔄 Seamless Integration
- **Single Launch**: Start both UI and blocker with one command
- **Real-time Communication**: HTTP API bridge between React and Python
- **Synchronized Sessions**: Timer and blocker start/stop together
- **Status Updates**: Live blocker status in the UI
- **Error Handling**: Graceful fallback if blocker unavailable

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **Python 3.7+** with packages:
  ```bash
  pip install psutil pywin32
  ```

### Option 1: Launch Everything Together (Recommended)
```bash
python launch_nexus.py
```

This will:
1. Check all requirements
2. Install npm dependencies if needed
3. Start the app blocker service
4. Launch the React UI
5. Open your browser automatically

### Option 2: Manual Launch
1. **Start the app blocker** (in one terminal):
   ```bash
   python comprehensive_app_blocker.py
   ```

2. **Start the React app** (in another terminal):
   ```bash
   npm install  # if first time
   npm start
   ```

## 🎯 How It Works

### Focus Session Flow
1. **Start**: Click "Start Protected Focus" in the React UI
2. **Blocker Activates**: Python service begins monitoring ALL running processes
3. **Apps Blocked**: Any distracting app that starts gets terminated within 1 second
4. **Real-time Feedback**: UI shows live blocking statistics
5. **Session Complete**: Both timer and blocker stop automatically

### What Gets Blocked
**Web Browsers**: Chrome, Firefox, Edge, Opera, Safari, Brave, Vivaldi  
**Social Media**: Discord, WhatsApp, Telegram, Skype, Slack, Teams  
**Gaming**: Steam, Epic Games, Battle.net, Origin, League of Legends, Valorant  
**Entertainment**: Spotify, Netflix, VLC, iTunes, YouTube Music, Twitch  
**Shopping**: Amazon, eBay, AliExpress  
**And 40+ more application types!**

### What Stays Safe
- **System Processes**: Windows core services
- **Security Software**: Antivirus, Windows Defender
- **Development Tools**: VS Code, PyCharm (productivity apps)
- **Essential Communication**: Emergency/work communication tools
- **FlowGenix Itself**: The React app and Python service

## 🎨 Themes & Customization

### Available Themes
1. **🌟 K-Pop Flow**: Vibrant colors with Korean pop aesthetics
2. **⚡ Anime Power**: Dynamic anime-inspired visuals
3. **🏎️ Racing Mode**: High-energy car racing theme
4. **🎵 Music Vibes**: Smooth musical theme with soundwaves

Each theme includes:
- Custom color gradients and animations
- Theme-specific background music
- Coordinated UI elements
- Unique animated icons

### Customization Options
- **Timer Duration**: 5, 15, 25, 45 minutes or 1 hour
- **Camera Monitoring**: Face detection for focus tracking
- **Background Music**: Enable/disable theme music
- **Notifications**: Desktop notifications for sessions
- **App Blocking**: Toggle comprehensive protection

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌──────────────────────┐
│   React UI      │◄──────────────►│  Python Blocker     │
│   (Port 3000)   │                │  (Port 8888)        │
└─────────────────┘                └──────────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                ┌──────────────────────┐
│   User          │                │  Windows Processes   │
│   Interface     │                │  Monitoring &        │
│                 │                │  Termination         │
└─────────────────┘                └──────────────────────┘
```

### Component Integration
- **appBlockerService.js**: React service for blocker communication
- **comprehensive_app_blocker.py**: Core Python blocking engine
- **launch_nexus.py**: Unified launcher for both systems
- **FocusTimer.js**: Enhanced timer with blocker integration

## 🔧 Technical Details

### App Blocking Technology
- **Process Monitoring**: psutil for cross-platform process detection
- **Process Termination**: win32api for reliable Windows app termination  
- **HTTP Bridge**: RESTful API for React-Python communication
- **Real-time Updates**: WebSocket-style status polling
- **Error Recovery**: Automatic retry and graceful degradation

### Security & Safety
- **Safe List Protection**: Essential system processes are never terminated
- **User Control**: Full on/off control over blocking functionality
- **Transparent Operation**: All blocking actions are logged and visible
- **Recovery Mechanism**: Blocked apps can be restarted after session ends

### Performance
- **1-Second Monitoring**: Fast response to new app launches
- **Minimal Resource Usage**: Efficient process scanning
- **Background Operation**: Doesn't interfere with legitimate work
- **Automatic Cleanup**: All processes cleanly stopped on session end

## 📱 Usage Tips

### Best Practices
1. **Test First**: Try a 5-minute session to see what gets blocked
2. **Customize Blocklist**: Edit `comprehensive_app_blocker.py` to add/remove apps
3. **Keep Terminal Open**: The launcher terminal must stay open during sessions
4. **Plan Ahead**: Close important work before starting focus sessions
5. **Emergency Exit**: Use Ctrl+C in terminal to stop everything immediately

### Troubleshooting
- **"Service not running"**: Make sure Python blocker started successfully
- **Apps not blocked**: Check Windows permissions for process termination
- **UI not loading**: Verify Node.js installation and run `npm install`
- **Port conflicts**: Close other apps using ports 3000 or 8888

## 🎁 What's Included in NEXUS

### React UI Components
- Enhanced FocusTimer with blocker integration
- Real-time blocking status display
- Comprehensive settings panel
- App blocker service bridge
- Seamless error handling

### Python Blocker Service
- Comprehensive app blocking engine
- HTTP API server
- Process monitoring system
- Safe app protection
- Logging and statistics

### Integration Scripts
- Unified launcher (`launch_nexus.py`)
- Service bridge (`appBlockerService.js`)
- Configuration files
- Documentation and examples

## 🚀 Create NEXUS Package

To create a zip file named "nexus" with everything integrated, the complete system is now ready! All components work together seamlessly:

1. **React UI** - Beautiful, animated interface
2. **App Blocker** - Comprehensive Windows app blocking
3. **Integration Layer** - HTTP API bridge
4. **Launcher** - Single command to start everything
5. **Documentation** - Complete setup and usage guide

The NEXUS system transforms your focus sessions from simple timers into comprehensive productivity environments where distractions are automatically eliminated while you work.

**Ready to experience the ultimate focus productivity solution? Run `python launch_nexus.py` and let NEXUS transform your productivity!**
