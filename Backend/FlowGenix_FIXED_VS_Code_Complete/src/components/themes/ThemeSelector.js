import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ThemeSelector = () => {
  const { state, setTheme } = useApp();

  const themes = [
    {
      id: 'kpop',
      name: 'K-Pop Flow',
      icon: '🌟',
      description: 'Bright and energetic with K-Pop vibes',
      gradient: 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700',
      preview: {
        primary: '#FF6B9D',
        secondary: '#A855F7',
        accent: '#06D6A0'
      },
      features: ['Vibrant colors', 'K-Pop inspired', 'Energetic feel']
    },
    {
      id: 'anime',
      name: 'Anime Power',
      icon: '⚡',
      description: 'Dynamic and powerful anime aesthetics',
      gradient: 'bg-gradient-to-br from-red-500 via-purple-600 to-blue-600',
      preview: {
        primary: '#FF4081',
        secondary: '#536DFE',
        accent: '#FFC107'
      },
      features: ['Bold design', 'Anime inspired', 'Power themes']
    },
    {
      id: 'car',
      name: 'Racing Mode',
      icon: '🏎️',
      description: 'Sleek and fast car racing theme',
      gradient: 'bg-gradient-to-br from-orange-600 via-gray-700 to-gray-900',
      preview: {
        primary: '#FF5722',
        secondary: '#607D8B',
        accent: '#FFC107'
      },
      features: ['Sleek design', 'Racing inspired', 'Speed focused']
    },
    {
      id: 'music',
      name: 'Music Vibes',
      icon: '🎵',
      description: 'Rhythmic and melodic music theme',
      gradient: 'bg-gradient-to-br from-purple-700 via-pink-600 to-cyan-500',
      preview: {
        primary: '#9C27B0',
        secondary: '#E91E63',
        accent: '#00BCD4'
      },
      features: ['Musical feel', 'Rhythmic design', 'Melodic colors']
    }
  ];

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
  };

  const getCurrentThemeData = () => {
    return themes.find(theme => theme.id === state.theme) || themes[0];
  };

  const currentTheme = getCurrentThemeData();

  return (
    <div className={`min-h-screen p-4 ${currentTheme.gradient}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-shadow">
            🎨 Choose Your Theme
          </h1>
          <p className="text-white text-opacity-80 text-lg">
            Select a theme that matches your vibe and helps you stay focused
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
                state.theme === theme.id 
                  ? 'ring-4 ring-white ring-opacity-60 shadow-2xl scale-105' 
                  : 'hover:scale-102 hover:shadow-xl'
              }`}
              onClick={() => handleThemeChange(theme.id)}
              whileHover={{ 
                scale: state.theme === theme.id ? 1.05 : 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              <div className={`${theme.gradient} p-6 h-full min-h-[300px]`}>
                {/* Selection Indicator */}
                {state.theme === theme.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-md rounded-full p-2"
                  >
                    <Check className="w-6 h-6 text-white" />
                  </motion.div>
                )}

                {/* Theme Content */}
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-4xl">{theme.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{theme.name}</h3>
                      <p className="text-white text-opacity-80 text-sm">{theme.description}</p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="flex space-x-2 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full shadow-lg"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full shadow-lg"
                      style={{ backgroundColor: theme.preview.secondary }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full shadow-lg"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                  </div>

                  {/* Features */}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">Features:</h4>
                    <ul className="space-y-1">
                      {theme.features.map((feature, idx) => (
                        <li key={idx} className="text-white text-opacity-80 text-sm flex items-center">
                          <span className="w-1 h-1 bg-white rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Theme Preview Elements */}
                  <div className="mt-6">
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 border border-white border-opacity-20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-white font-medium">Preview Timer</div>
                        <div className="text-2xl">{theme.icon}</div>
                      </div>
                      
                      {/* Mock Timer Circle */}
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full border-4 border-white border-opacity-30 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">25:00</span>
                        </div>
                      </div>

                      {/* Mock Button */}
                      <motion.button
                        className="w-full py-2 rounded-lg bg-white bg-opacity-20 text-white text-sm font-medium backdrop-blur-sm"
                        whileHover={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          scale: 1.02 
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Focus Session
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Current Theme Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="card max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-white mb-2">Current Theme</h3>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="text-3xl">{currentTheme.icon}</div>
              <div className="text-lg text-white font-medium">{currentTheme.name}</div>
            </div>
            <p className="text-white text-opacity-80 text-sm">
              {currentTheme.description}
            </p>
          </div>
        </motion.div>

        {/* Theme Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <div className="card text-center">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 Theme Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="glass-effect rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🌟 K-Pop Flow</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Perfect for high-energy study sessions and creative work
                </p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">⚡ Anime Power</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Great for intense focus and challenging tasks
                </p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🏎️ Racing Mode</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Ideal for time-pressured work and competitive studying
                </p>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">🎵 Music Vibes</h4>
                <p className="text-white text-opacity-80 text-sm">
                  Best for relaxed focus sessions and creative projects
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThemeSelector;
