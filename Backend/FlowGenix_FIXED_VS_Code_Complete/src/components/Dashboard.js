import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Dashboard = () => {
  const { state } = useApp();

  const getThemeData = () => {
    const themes = {
      kpop: { 
        gradient: 'bg-gradient-kpop',
        accent: 'text-kpop-accent',
        icon: '🌟',
        title: 'K-Pop Flow Dashboard'
      },
      anime: { 
        gradient: 'bg-gradient-anime',
        accent: 'text-anime-accent',
        icon: '⚡',
        title: 'Anime Power Dashboard'
      },
      car: { 
        gradient: 'bg-gradient-car',
        accent: 'text-car-accent',
        icon: '🏎️',
        title: 'Racing Mode Dashboard'
      },
      music: { 
        gradient: 'bg-gradient-music',
        accent: 'text-music-accent',
        icon: '🎵',
        title: 'Music Vibes Dashboard'
      }
    };
    return themes[state.theme] || themes.kpop;
  };

  const getButtonClass = () => {
    const buttons = {
      kpop: 'btn-kpop',
      anime: 'btn-anime',
      car: 'btn-car',
      music: 'btn-music'
    };
    return buttons[state.theme] || buttons.kpop;
  };

  const stats = {
    totalFocusTime: state.history.reduce((acc, h) => acc + (h.duration || 0), 0),
    totalSessions: state.history.filter(h => h.type === 'focus').length,
    todaysTasks: state.todos.filter(t => !t.completed).length,
    upcomingEvents: state.calendar.filter(e => new Date(e.date) >= new Date()).length,
    averageSession: state.history.filter(h => h.type === 'focus').length > 0 
      ? Math.round(state.history.filter(h => h.type === 'focus')
          .reduce((acc, h) => acc + (h.duration || 0), 0) / 
          state.history.filter(h => h.type === 'focus').length)
      : 0,
    streak: Math.min(7, Math.floor(state.history.filter(h => h.type === 'focus').length / 3))
  };

  const themeData = getThemeData();

  const quickActions = [
    { 
      to: '/timer', 
      icon: Timer, 
      title: 'Focus Timer', 
      desc: 'Start a focus session',
      color: 'text-blue-400'
    },
    { 
      to: '/todo', 
      icon: CheckSquare, 
      title: 'Todo List', 
      desc: 'Manage your tasks',
      color: 'text-green-400'
    },
    { 
      to: '/calendar', 
      icon: Calendar, 
      title: 'Calendar', 
      desc: 'Check your schedule',
      color: 'text-purple-400'
    },
    { 
      to: '/rewards', 
      icon: Award, 
      title: 'Rewards', 
      desc: 'Redeem your coins',
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 text-shadow">
              {themeData.icon} Welcome back, {state.user?.name}!
            </h1>
            <p className="text-white text-opacity-80 text-lg">
              {themeData.title}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              className="card text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold mb-1">{Math.round(stats.totalFocusTime / 60)}h</div>
              <div className="text-sm opacity-80">Total Focus</div>
            </motion.div>

            <motion.div
              className="card text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Target className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold mb-1">{stats.totalSessions}</div>
              <div className="text-sm opacity-80">Sessions</div>
            </motion.div>

            <motion.div
              className="card text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold mb-1">{state.coins}</div>
              <div className="text-sm opacity-80">Coins</div>
            </motion.div>

            <motion.div
              className="card text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold mb-1">{stats.streak}</div>
              <div className="text-sm opacity-80">Day Streak</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link to={action.to}>
                  <motion.div
                    className="card hover:bg-opacity-20 transition-all duration-300 cursor-pointer"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                      <action.icon className={`w-12 h-12 mx-auto mb-4 ${action.color}`} />
                      <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                      <p className="text-white text-opacity-70 text-sm">{action.desc}</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Current Focus Session */}
        {state.focusSession.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="card bg-opacity-20 border-2 border-white border-opacity-30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    🎯 Active Focus Session
                  </h3>
                  <p className="text-white text-opacity-80">
                    {Math.floor(state.focusSession.timeLeft / 60)}:{(state.focusSession.timeLeft % 60).toString().padStart(2, '0')} remaining
                  </p>
                </div>
                <Link to="/timer">
                  <motion.button
                    className={`btn-primary ${getButtonClass()}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Timer
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Today's Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Today's Tasks</h3>
              <Link to="/todo" className="text-white text-opacity-70 hover:text-opacity-100 transition-opacity">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {state.todos.slice(0, 3).map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center space-x-3 p-2 rounded-lg glass-effect"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    todo.completed ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                  <span className={`text-white ${
                    todo.completed ? 'line-through text-opacity-60' : ''
                  }`}>
                    {todo.text}
                  </span>
                </motion.div>
              ))}
              {state.todos.length === 0 && (
                <p className="text-white text-opacity-70 text-center py-4">
                  No tasks yet. Create your first task!
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upcoming Events</h3>
              <Link to="/calendar" className="text-white text-opacity-70 hover:text-opacity-100 transition-opacity">
                View Calendar
              </Link>
            </div>
            <div className="space-y-2">
              {state.calendar.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center space-x-3 p-2 rounded-lg glass-effect"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <div>
                    <span className="text-white block">{event.title}</span>
                    <span className="text-white text-opacity-60 text-sm">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </span>
                  </div>
                </motion.div>
              ))}
              {state.calendar.length === 0 && (
                <p className="text-white text-opacity-70 text-center py-4">
                  No events scheduled. Plan your day!
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="card text-center bg-opacity-20"
        >
          <div className="text-4xl mb-4">{themeData.icon}</div>
          <blockquote className="text-xl text-white font-medium mb-2">
            "The secret of getting ahead is getting started."
          </blockquote>
          <cite className="text-white text-opacity-70">- Mark Twain</cite>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
