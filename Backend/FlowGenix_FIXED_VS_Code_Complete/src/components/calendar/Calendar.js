import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Clock, Mic } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Calendar = () => {
  const { state, addCalendarEvent } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', description: '', reminder: true });
  const [showAddEvent, setShowAddEvent] = useState(false);

  const getThemeData = () => {
    const themes = {
      kpop: { gradient: 'bg-gradient-kpop', icon: '🌟' },
      anime: { gradient: 'bg-gradient-anime', icon: '⚡' },
      car: { gradient: 'bg-gradient-car', icon: '🏎️' },
      music: { gradient: 'bg-gradient-music', icon: '🎵' }
    };
    return themes[state.theme] || themes.kpop;
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (newEvent.title && newEvent.time) {
      addCalendarEvent({
        ...newEvent,
        date: selectedDate
      });
      setNewEvent({ title: '', time: '', description: '', reminder: true });
      setShowAddEvent(false);
    }
  };

  const themeData = getThemeData();
  const todayEvents = state.calendar.filter(event => 
    event.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow">
            {themeData.icon} Calendar & Schedule
          </h1>
          <p className="text-white text-opacity-80">
            Plan your day and get voice reminders
          </p>
        </motion.div>

        {/* Today's Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Today's Events</h2>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className={`btn-primary flex items-center space-x-2 ${
                state.theme === 'kpop' ? 'btn-kpop' :
                state.theme === 'anime' ? 'btn-anime' :
                state.theme === 'car' ? 'btn-car' : 'btn-music'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>

          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-effect rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-white text-opacity-70 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        {event.reminder && (
                          <div className="flex items-center space-x-1">
                            <Mic className="w-4 h-4" />
                            <span>Voice reminder</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-white text-opacity-70 text-sm mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white text-opacity-70">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for today</p>
            </div>
          )}
        </motion.div>

        {/* Add Event Form */}
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card mb-8"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Add New Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
                className="input-field w-full"
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                />
                
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description (optional)"
                className="input-field w-full h-24 resize-none"
              />
              
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={newEvent.reminder}
                  onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Enable voice reminders</span>
              </label>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className={`btn-primary flex-1 ${
                    state.theme === 'kpop' ? 'btn-kpop' :
                    state.theme === 'anime' ? 'btn-anime' :
                    state.theme === 'car' ? 'btn-car' : 'btn-music'
                  }`}
                >
                  Add Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="btn-primary bg-gray-600 hover:bg-gray-700 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
          
          {state.calendar.length > 0 ? (
            <div className="space-y-3">
              {state.calendar
                .filter(event => new Date(event.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="glass-effect rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-white text-opacity-70 mt-1">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      </div>
                      {event.reminder && (
                        <Mic className="w-5 h-5 text-white text-opacity-50" />
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white text-opacity-70">
              <p>No upcoming events scheduled</p>
            </div>
          )}
        </motion.div>

        {/* Voice Reminder Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mt-8 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🎤 Voice Reminders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="glass-effect rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Morning Events</h4>
              <p className="text-white text-opacity-70 text-sm">
                Get reminded the night before for morning events
              </p>
            </div>
            <div className="glass-effect rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Afternoon Events</h4>
              <p className="text-white text-opacity-70 text-sm">
                Get reminded in the morning for afternoon events
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar;
