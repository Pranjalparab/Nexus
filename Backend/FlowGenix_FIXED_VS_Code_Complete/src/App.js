import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { AppProvider, useApp } from './contexts/AppContext';
import AuthComponent from './components/auth/AuthComponent';
import Dashboard from './components/Dashboard';
import FocusTimer from './components/timer/FocusTimer';
import TodoList from './components/todo/TodoList';
import Calendar from './components/calendar/Calendar';
import Rewards from './components/rewards/Rewards';
import History from './components/history/History';
import Settings from './components/Settings';
import ThemeSelector from './components/themes/ThemeSelector';
import Chatbot from './components/chatbot/Chatbot';
import Navigation from './components/Navigation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { state } = useApp();
  return state.isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// App Content Component
const AppContent = () => {
  const { state } = useApp();
  
  return (
    <Router>
      <div className={`min-h-screen transition-all duration-500 ${
        state.theme === 'kpop' ? 'theme-kpop' : 
        state.theme === 'anime' ? 'theme-anime' :
        state.theme === 'car' ? 'theme-car' : 'theme-music'
      }`}>
        
        {/* Navigation - only show when authenticated */}
        {state.isAuthenticated && <Navigation />}
        
        {/* Main Content */}
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/auth" 
              element={
                state.isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <AuthComponent />
              } 
            />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/timer" element={
              <ProtectedRoute>
                <FocusTimer />
              </ProtectedRoute>
            } />
            
            <Route path="/todo" element={
              <ProtectedRoute>
                <TodoList />
              </ProtectedRoute>
            } />
            
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } />
            
            <Route path="/rewards" element={
              <ProtectedRoute>
                <Rewards />
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/themes" element={
              <ProtectedRoute>
                <ThemeSelector />
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        
        {/* Floating Chatbot */}
        {state.isAuthenticated && <Chatbot />}
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            },
          }}
        />
      </div>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
