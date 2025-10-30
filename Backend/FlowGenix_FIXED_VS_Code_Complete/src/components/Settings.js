import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Camera, Volume2, Shield } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Settings = () => {
  const { state, updateSettings } = useApp();

  const getThemeData = () => {
    const themes = {
      kpop: { gradient: 'bg-gradient-kpop', icon: '🌟' },
      anime: { gradient: 'bg-gradient-anime', icon: '⚡' },
      car: { gradient: 'bg-gradient-car', icon: '🏎️' },
      music: { gradient: 'bg-gradient-music', icon: '🎵' }
    };
    return themes[state.theme] || themes.kpop;
  };

  const handleSettingChange = (setting, value) => {
    updateSettings({ [setting]: value });
  };

  const themeData = getThemeData();

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow">
            {themeData.icon} Settings
          </h1>
          <p className="text-white text-opacity-80">
            Customize your FlowGenix experience
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Push Notifications</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Receive notifications about focus sessions and reminders
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Voice Reminders</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Get voice reminders for scheduled events
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.reminderVoice}
                    onChange={(e) => handleSettingChange('reminderVoice', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Focus Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Camera className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Focus Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Camera Monitoring</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Randomly check if you're focused during sessions
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.cameraCheck}
                    onChange={(e) => handleSettingChange('cameraCheck', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Background Music</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Play theme music during focus sessions
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.backgroundMusic}
                    onChange={(e) => handleSettingChange('backgroundMusic', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* App Blocking (Teacher Mode Button) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold text-white">App Control</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Teacher Mode</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Enhanced controls for educational environments (Coming Soon)
                  </p>
                </div>
                <button
                  className="btn-primary bg-gray-600 hover:bg-gray-700 cursor-not-allowed opacity-50"
                  disabled
                >
                  Coming Soon
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">App Blocking</h3>
                  <p className="text-white text-opacity-70 text-sm">
                    Block distracting apps during focus sessions
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={state.settings.appBlocking}
                    onChange={(e) => handleSettingChange('appBlocking', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={state.user?.avatar}
                  alt={state.user?.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-white font-medium text-lg">{state.user?.name}</h3>
                  <p className="text-white text-opacity-70">{state.user?.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-white text-opacity-70">
                    <span>💰 {state.coins} coins</span>
                    <span>🎯 {state.history.filter(h => h.type === 'focus').length} sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center"
          >
            <h2 className="text-xl font-semibold text-white mb-4">About FlowGenix</h2>
            <div className="text-4xl mb-4">{themeData.icon}</div>
            <p className="text-white text-opacity-80 mb-4">
              FlowGenix is your ultimate focus companion with beautiful themes, 
              productivity tracking, and smart features to help you achieve your goals.
            </p>
            <div className="text-white text-opacity-70 text-sm">
              Version 1.0.0 • Made with ❤️ for productivity
            </div>
          </motion.div>
        </div>
      </div>

      {/* Custom Switch Styles */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background: linear-gradient(135deg, #FF6B9D 0%, #A855F7 100%);
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }
      `}</style>
    </div>
  );
};

export default Settings;
