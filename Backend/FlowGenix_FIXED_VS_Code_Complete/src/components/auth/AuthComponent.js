import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const AuthComponent = () => {
  const { login, state } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isLogin) {
        // Login logic
        if (formData.email && formData.password) {
          const user = {
            id: Date.now(),
            name: formData.email.split('@')[0],
            email: formData.email,
            avatar: `https://ui-avatars.com/api/?name=${formData.email}&background=FF6B9D&color=fff`
          };
          login(user);
        } else {
          throw new Error('Please fill all fields');
        }
      } else {
        // Register logic
        if (formData.name && formData.email && formData.password) {
          const user = {
            id: Date.now(),
            name: formData.name,
            email: formData.email,
            avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=FF6B9D&color=fff`
          };
          login(user);
        } else {
          throw new Error('Please fill all fields');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Google OAuth simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const user = {
        id: Date.now(),
        name: 'Google User',
        email: 'user@gmail.com',
        avatar: `https://ui-avatars.com/api/?name=Google+User&background=FF6B9D&color=fff`,
        googleAccount: true
      };
      login(user);
    } catch (err) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const getThemeClasses = () => {
    const themes = {
      kpop: 'theme-kpop',
      anime: 'theme-anime',
      car: 'theme-car',
      music: 'theme-music'
    };
    return themes[state.theme] || themes.kpop;
  };

  const getButtonClasses = () => {
    const themes = {
      kpop: 'btn-kpop',
      anime: 'btn-anime',
      car: 'btn-car',
      music: 'btn-music'
    };
    return `btn-primary ${themes[state.theme] || themes.kpop}`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getThemeClasses()}`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
            className="text-4xl font-bold mb-2 text-shadow"
          >
            FlowGenix
          </motion.h1>
          <p className="text-white text-opacity-80">
            {isLogin ? 'Welcome back!' : 'Join the flow!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white text-opacity-70" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field w-full pl-10"
                required={!isLogin}
              />
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white text-opacity-70" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field w-full pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white text-opacity-70" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-field w-full pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-70 hover:text-opacity-100 transition-opacity"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-300 text-sm text-center bg-red-500 bg-opacity-20 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className={`${getButtonClasses()} w-full relative overflow-hidden`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white border-opacity-30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white text-opacity-70">Or continue with</span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full glass-effect rounded-xl px-4 py-3 text-white font-medium hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting...' : 'Google Account'}
          </motion.button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-white text-opacity-80 hover:text-opacity-100 transition-opacity"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthComponent;
