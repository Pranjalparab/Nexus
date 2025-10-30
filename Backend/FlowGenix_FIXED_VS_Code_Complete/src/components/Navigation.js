import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Timer, 
  CheckSquare, 
  Calendar, 
  Gift, 
  History, 
  Settings, 
  Palette,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Navigation = () => {
  const { state, logout } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/timer', icon: Timer, label: 'Focus Timer' },
    { path: '/todo', icon: CheckSquare, label: 'Todo List' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/themes', icon: Palette, label: 'Themes' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const getThemeClasses = () => {
    const themes = {
      kpop: 'from-kpop-primary to-kpop-secondary',
      anime: 'from-anime-primary to-anime-secondary',
      car: 'from-car-primary to-car-secondary',
      music: 'from-music-primary to-music-secondary'
    };
    return themes[state.theme] || themes.kpop;
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 glass-effect border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getThemeClasses()}`}></div>
              <span className="text-xl font-bold text-white">FlowGenix</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? `bg-gradient-to-r ${getThemeClasses()} text-white`
                      : 'text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:block">{label}</span>
                  </div>
                  {location.pathname === path && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-white from-opacity-20 to-transparent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
              >
                <img
                  src={state.user?.avatar}
                  alt={state.user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden lg:block text-white text-sm font-medium">
                  {state.user?.name}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 glass-effect rounded-lg shadow-xl border border-white border-opacity-20 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white border-opacity-20">
                      <div className="text-sm font-medium text-white">{state.user?.name}</div>
                      <div className="text-xs text-white text-opacity-70">{state.user?.email}</div>
                      <div className="text-xs text-white text-opacity-70 mt-1">
                        💰 {state.coins} coins
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-40 glass-effect border-b border-white border-opacity-20">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getThemeClasses()}`}></div>
              <span className="text-lg font-bold text-white">FlowGenix</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 md:hidden"
            >
              <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute right-0 top-0 h-full w-80 glass-effect border-l border-white border-opacity-20"
              >
                <div className="p-6">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-6 border-b border-white border-opacity-20">
                    <img
                      src={state.user?.avatar}
                      alt={state.user?.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="text-white font-medium">{state.user?.name}</div>
                      <div className="text-white text-opacity-70 text-sm">{state.user?.email}</div>
                      <div className="text-white text-opacity-70 text-sm">💰 {state.coins} coins</div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-2 py-6">
                    {navItems.map(({ path, icon: Icon, label }) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          location.pathname === path
                            ? `bg-gradient-to-r ${getThemeClasses()} text-white`
                            : 'text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10 transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16"></div>
    </>
  );
};

export default Navigation;
