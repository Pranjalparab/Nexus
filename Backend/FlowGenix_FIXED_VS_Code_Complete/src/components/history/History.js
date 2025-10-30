import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, Calendar, TrendingUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const History = () => {
  const { state } = useApp();

  const getThemeData = () => {
    const themes = {
      kpop: { gradient: 'bg-gradient-kpop', icon: '🌟' },
      anime: { gradient: 'bg-gradient-anime', icon: '⚡' },
      car: { gradient: 'bg-gradient-car', icon: '🏎️' },
      music: { gradient: 'bg-gradient-music', icon: '🎵' }
    };
    return themes[state.theme] || themes.kpop;
  };

  const themeData = getThemeData();
  const focusHistory = state.history.filter(h => h.type === 'focus');

  const stats = {
    totalSessions: focusHistory.length,
    totalTime: focusHistory.reduce((acc, h) => acc + (h.duration || 0), 0),
    totalCoins: focusHistory.reduce((acc, h) => acc + (h.coinsEarned || 0), 0),
    averageSession: focusHistory.length > 0 ? 
      Math.round(focusHistory.reduce((acc, h) => acc + (h.duration || 0), 0) / focusHistory.length) : 0
  };

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow">
            {themeData.icon} Focus History
          </h1>
          <p className="text-white text-opacity-80">
            Track your productivity journey
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold mb-1">{stats.totalSessions}</div>
            <div className="text-sm opacity-80">Total Sessions</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold mb-1">{Math.round(stats.totalTime / 60)}h</div>
            <div className="text-sm opacity-80">Total Time</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold mb-1">{stats.averageSession}m</div>
            <div className="text-sm opacity-80">Avg Session</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold mb-1">{stats.totalCoins}</div>
            <div className="text-sm opacity-80">Coins Earned</div>
          </motion.div>
        </div>

        {/* History List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Sessions</h2>
          
          {focusHistory.length > 0 ? (
            <div className="space-y-4">
              {focusHistory
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
                .map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="glass-effect rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {session.theme === 'kpop' && '🌟'}
                        {session.theme === 'anime' && '⚡'}
                        {session.theme === 'car' && '🏎️'}
                        {session.theme === 'music' && '🎵'}
                      </div>
                      
                      <div>
                        <div className="text-white font-medium">
                          {session.duration} minute focus session
                        </div>
                        <div className="text-white text-opacity-70 text-sm">
                          {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold">
                        +{session.coinsEarned} coins
                      </div>
                      <div className="text-white text-opacity-50 text-sm capitalize">
                        {session.theme} theme
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white text-opacity-70">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No focus sessions yet</h3>
              <p>Start your first focus session to see your history here!</p>
            </div>
          )}
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card mt-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`glass-effect rounded-lg p-4 text-center ${
              stats.totalSessions >= 1 ? 'border-2 border-yellow-400' : 'opacity-50'
            }`}>
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-white font-medium">First Session</div>
              <div className="text-white text-opacity-70 text-sm">Complete 1 focus session</div>
            </div>

            <div className={`glass-effect rounded-lg p-4 text-center ${
              stats.totalSessions >= 10 ? 'border-2 border-yellow-400' : 'opacity-50'
            }`}>
              <div className="text-4xl mb-2">🔥</div>
              <div className="text-white font-medium">Getting Hot</div>
              <div className="text-white text-opacity-70 text-sm">Complete 10 focus sessions</div>
            </div>

            <div className={`glass-effect rounded-lg p-4 text-center ${
              stats.totalTime >= 300 ? 'border-2 border-yellow-400' : 'opacity-50'
            }`}>
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-white font-medium">Time Master</div>
              <div className="text-white text-opacity-70 text-sm">Focus for 5 hours total</div>
            </div>

            <div className={`glass-effect rounded-lg p-4 text-center ${
              stats.totalCoins >= 200 ? 'border-2 border-yellow-400' : 'opacity-50'
            }`}>
              <div className="text-4xl mb-2">💰</div>
              <div className="text-white font-medium">Coin Collector</div>
              <div className="text-white text-opacity-70 text-sm">Earn 200 focus coins</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default History;
