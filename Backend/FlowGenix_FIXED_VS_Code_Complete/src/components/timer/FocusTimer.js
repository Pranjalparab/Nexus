import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Settings, Camera, CameraOff, Volume2, VolumeX, Shield, ShieldOff, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import appBlockerService from '../../services/appBlockerService';
import { toast } from 'react-hot-toast';

const FocusTimer = () => {
  const { state, startFocusSession, endFocusSession, dispatch } = useApp();
  const [duration, setDuration] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [backgroundMusic, setBackgroundMusic] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // App Blocker Integration States
  const [appBlockingEnabled, setAppBlockingEnabled] = useState(true);
  const [blockerStatus, setBlockerStatus] = useState({ active: false, blocked_count: 0 });
  const [blockerAvailable, setBlockerAvailable] = useState(false);
  
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const { focusSession, theme } = state;

  // Check app blocker availability on mount
  useEffect(() => {
    const checkBlockerAvailability = async () => {
      const available = await appBlockerService.isBlockingAvailable();
      setBlockerAvailable(available);
      
      if (available) {
        toast.success('🛡️ Comprehensive app blocking is available!', {
          duration: 3000,
          icon: '🛡️'
        });
      } else {
        toast.error('⚠️ App blocker service not running. Start comprehensive_app_blocker.py for full protection.', {
          duration: 5000,
          icon: '⚠️'
        });
      }
    };
    
    checkBlockerAvailability();
    
    // Set up status update callback
    appBlockerService.setStatusUpdateCallback((status) => {
      setBlockerStatus(status);
    });
  }, []);

  useEffect(() => {
    if (focusSession.isActive && focusSession.timeLeft > 0) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'UPDATE_FOCUS_TIME', payload: focusSession.timeLeft - 1 });
      }, 1000);
    } else if (focusSession.timeLeft === 0 && focusSession.isActive) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [focusSession.timeLeft, focusSession.isActive]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    endFocusSession();
    
    // Stop app blocking
    if (appBlockingEnabled && blockerAvailable) {
      const result = await appBlockerService.stopFocusMode();
      if (result.success) {
        toast.success(`🎉 Focus complete! Apps unblocked. ${result.message}`);
      }
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FlowGenix - Focus Session Complete!', {
        body: `Great job! You focused for ${duration} minutes. ${blockerStatus.blocked_count > 0 ? `Blocked ${blockerStatus.blocked_count} distracting apps!` : ''}`,
        icon: '/logo192.png'
      });
    }

    // Play completion sound
    const audio = new Audio('/sounds/timer-complete.mp3');
    audio.play().catch(console.error);
  };

  const startTimer = async () => {
    if (!focusSession.isActive) {
      // Start React focus session
      startFocusSession({ duration, theme });
      
      // Start comprehensive app blocking if available
      if (appBlockingEnabled && blockerAvailable) {
        const result = await appBlockerService.startFocusMode(duration);
        if (result.success) {
          toast.success(`🛡️ Comprehensive protection activated! All distracting apps will be blocked.`, {
            duration: 4000,
            icon: '🛡️'
          });
        } else {
          toast.error(`Failed to start app blocking: ${result.message}`, {
            duration: 5000,
            icon: '⚠️'
          });
        }
      } else if (appBlockingEnabled && !blockerAvailable) {
        toast.warning('⚠️ App blocking disabled - service not running. Focus mode will continue without comprehensive protection.', {
          duration: 6000,
          icon: '⚠️'
        });
      }
      
      if (state.settings.cameraCheck) {
        startCameraMonitoring();
      }
      if (backgroundMusic) {
        startBackgroundMusic();
      }
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const stopTimer = async () => {
    setIsRunning(false);
    endFocusSession();
    
    // Stop app blocking
    if (appBlockingEnabled && blockerAvailable) {
      const result = await appBlockerService.stopFocusMode();
      if (result.success) {
        toast.success(`🛞️ Focus session stopped. Apps unblocked. ${result.message}`);
      }
    }
    
    stopCameraMonitoring();
    stopBackgroundMusic();
  };

  const startCameraMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Random camera checks during focus session
      const checkInterval = setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
          checkUserFocus();
        }
      }, 120000); // Check every 2 minutes

      return () => clearInterval(checkInterval);
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const stopCameraMonitoring = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setShowCamera(false);
    }
  };

  const checkUserFocus = () => {
    // Simulate focus detection (in real app, use ML/AI for face detection)
    const isFocused = Math.random() > 0.3; // 70% chance user is focused
    
    if (!isFocused) {
      // Show gentle reminder
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FlowGenix - Stay Focused!', {
          body: 'Keep your eyes on the goal! 👀',
          icon: '/logo192.png'
        });
      }
    }
  };

  const startBackgroundMusic = () => {
    const musicFiles = {
      kpop: '/sounds/kpop-bg.mp3',
      anime: '/sounds/anime-bg.mp3',
      car: '/sounds/car-bg.mp3',
      music: '/sounds/music-bg.mp3'
    };

    if (audioRef.current) {
      audioRef.current.src = musicFiles[theme];
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(console.error);
    }
  };

  const stopBackgroundMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThemeAnimation = () => {
    const animations = {
      kpop: {
        background: 'bg-gradient-kpop',
        pulse: 'animate-kpop-pulse',
        icon: '🌟',
        title: 'K-Pop Flow'
      },
      anime: {
        background: 'bg-gradient-anime',
        pulse: 'animate-anime-pulse',
        icon: '⚡',
        title: 'Anime Power'
      },
      car: {
        background: 'bg-gradient-car',
        pulse: 'animate-car-pulse',
        icon: '🏎️',
        title: 'Racing Mode'
      },
      music: {
        background: 'bg-gradient-music',
        pulse: 'animate-music-pulse',
        icon: '🎵',
        title: 'Music Vibes'
      }
    };
    return animations[theme] || animations.kpop;
  };

  const themeData = getThemeAnimation();
  const progress = focusSession.isActive ? 
    ((focusSession.duration * 60 - focusSession.timeLeft) / (focusSession.duration * 60)) * 100 : 0;

  return (
    <div className={`min-h-screen p-4 ${themeData.background}`}>
      <audio ref={audioRef} />
      
      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="camera-overlay"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white text-shadow"
          >
            {themeData.icon} {themeData.title}
          </motion.h1>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setBackgroundMusic(!backgroundMusic)}
              className="p-3 glass-effect rounded-xl hover:bg-opacity-20 transition-all"
            >
              {backgroundMusic ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
            
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="p-3 glass-effect rounded-xl hover:bg-opacity-20 transition-all"
            >
              {showCamera ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 glass-effect rounded-xl hover:bg-opacity-20 transition-all"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Timer Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.div
            className={`timer-circle ${themeData.pulse} mb-8 relative`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="120"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="120"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {focusSession.isActive ? formatTime(focusSession.timeLeft) : formatTime(duration * 60)}
              </div>
              <div className="text-lg opacity-80">
                {focusSession.isActive ? 'Focus Time' : 'Ready to Focus'}
              </div>
            </div>
          </motion.div>

          {/* Theme-specific Animation Elements */}
          <div className="flex justify-center space-x-8 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="text-4xl"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              >
                {themeData.icon}
              </motion.div>
            ))}
          </div>
        </div>

        {/* App Blocking Status */}
        {blockerAvailable && (
          <motion.div
            className="card mb-6 text-center"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              {blockerStatus.active ? (
                <>
                  <Shield className="w-6 h-6 text-green-400" />
                  <span className="text-lg font-semibold text-green-400">Comprehensive Protection Active</span>
                </>
              ) : (
                <>
                  <ShieldOff className="w-6 h-6 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-400">Protection Ready</span>
                </>
              )}
            </div>
            {blockerStatus.active && (
              <div className="text-sm opacity-80">
                🚫 Blocked {blockerStatus.blocked_count || 0} distracting apps
                {blockerStatus.remaining_seconds && (
                  <> • {Math.ceil(blockerStatus.remaining_seconds / 60)} min remaining</>
                )}
              </div>
            )}
            {!blockerStatus.active && appBlockingEnabled && (
              <div className="text-sm opacity-80">
                Ready to block ALL distracting apps during focus sessions
              </div>
            )}
          </motion.div>
        )}

        {/* Timer Controls */}
        <div className="flex justify-center space-x-6 mb-8">
          {!focusSession.isActive ? (
            <>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="input-field text-center"
                disabled={isRunning}
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={25}>25 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
              </select>
              
              <motion.button
                onClick={startTimer}
                className={`btn-primary px-8 py-4 text-lg flex items-center space-x-2 ${
                  theme === 'kpop' ? 'btn-kpop' : 
                  theme === 'anime' ? 'btn-anime' :
                  theme === 'car' ? 'btn-car' : 'btn-music'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-6 h-6" />
                <span>Start {appBlockingEnabled && blockerAvailable ? 'Protected' : ''} Focus</span>
              </motion.button>
            </>
          ) : (
            <div className="flex space-x-4">
              <motion.button
                onClick={isRunning ? pauseTimer : startTimer}
                className={`btn-primary px-6 py-3 flex items-center space-x-2 ${
                  theme === 'kpop' ? 'btn-kpop' : 
                  theme === 'anime' ? 'btn-anime' :
                  theme === 'car' ? 'btn-car' : 'btn-music'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </motion.button>
              
              <motion.button
                onClick={stopTimer}
                className="btn-primary px-6 py-3 bg-red-500 hover:bg-red-600 flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            className="card text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold mb-2">{state.coins}</div>
            <div className="text-sm opacity-80">Focus Coins</div>
          </motion.div>
          
          <motion.div
            className="card text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold mb-2">{state.history.filter(h => h.type === 'focus').length}</div>
            <div className="text-sm opacity-80">Sessions</div>
          </motion.div>
          
          <motion.div
            className="card text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold mb-2">
              {Math.round(state.history.reduce((acc, h) => acc + (h.duration || 0), 0) / 60)}h
            </div>
            <div className="text-sm opacity-80">Total Time</div>
          </motion.div>
          
          <motion.div
            className="card text-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold mb-2">
              {Math.round((state.history.filter(h => h.type === 'focus').length / 30) * 100)}%
            </div>
            <div className="text-sm opacity-80">Monthly Goal</div>
          </motion.div>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="card max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Timer Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Comprehensive App Blocking</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={appBlockingEnabled}
                      onChange={(e) => setAppBlockingEnabled(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                  
                  {!blockerAvailable && appBlockingEnabled && (
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm">
                      <div className="flex items-center space-x-2 text-yellow-400 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">Service Required</span>
                      </div>
                      <p className="text-yellow-300">To enable comprehensive app blocking, start the app blocker service by running comprehensive_app_blocker.py</p>
                    </div>
                  )}
                  
                  <label className="flex items-center justify-between">
                    <span>Camera Monitoring</span>
                    <input
                      type="checkbox"
                      checked={state.settings.cameraCheck}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_SETTINGS',
                        payload: { cameraCheck: e.target.checked }
                      })}
                      className="w-5 h-5"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Background Music</span>
                    <input
                      type="checkbox"
                      checked={backgroundMusic}
                      onChange={(e) => setBackgroundMusic(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span>Notifications</span>
                    <input
                      type="checkbox"
                      checked={state.settings.notifications}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_SETTINGS',
                        payload: { notifications: e.target.checked }
                      })}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
                
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn-primary w-full mt-6 bg-gray-600 hover:bg-gray-700"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusTimer;
