import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Calendar, Flag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const TodoList = () => {
  const { state, addTodo, toggleTodo, deleteTodo } = useApp();
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const getThemeData = () => {
    const themes = {
      kpop: { gradient: 'bg-gradient-kpop', icon: '🌟' },
      anime: { gradient: 'bg-gradient-anime', icon: '⚡' },
      car: { gradient: 'bg-gradient-car', icon: '🏎️' },
      music: { gradient: 'bg-gradient-music', icon: '🎵' }
    };
    return themes[state.theme] || themes.kpop;
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTodo({ 
        text: newTask.trim(), 
        priority, 
        dueDate: dueDate || null 
      });
      setNewTask('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-400 bg-red-400',
      medium: 'text-yellow-400 bg-yellow-400',
      low: 'text-green-400 bg-green-400'
    };
    return colors[priority] || colors.medium;
  };

  const themeData = getThemeData();
  const completedTasks = state.todos.filter(todo => todo.completed);
  const pendingTasks = state.todos.filter(todo => !todo.completed);

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow">
            {themeData.icon} Todo List
          </h1>
          <p className="text-white text-opacity-80">
            Organize your tasks and boost your productivity
          </p>
        </motion.div>

        {/* Add New Task */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <form onSubmit={handleAddTask} className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What do you want to accomplish?"
              className="input-field w-full"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
              
              <button
                type="submit"
                className={`btn-primary flex items-center justify-center space-x-2 ${
                  state.theme === 'kpop' ? 'btn-kpop' :
                  state.theme === 'anime' ? 'btn-anime' :
                  state.theme === 'car' ? 'btn-car' : 'btn-music'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Task</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-2xl font-bold mb-1">{state.todos.length}</div>
            <div className="text-sm opacity-80">Total Tasks</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-2xl font-bold mb-1">{pendingTasks.length}</div>
            <div className="text-sm opacity-80">Pending</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-2xl font-bold mb-1">{completedTasks.length}</div>
            <div className="text-sm opacity-80">Completed</div>
          </motion.div>

          <motion.div
            className="card text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-2xl font-bold mb-1">
              {state.todos.length > 0 ? Math.round((completedTasks.length / state.todos.length) * 100) : 0}%
            </div>
            <div className="text-sm opacity-80">Progress</div>
          </motion.div>
        </div>

        {/* Task Lists */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Pending Tasks</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingTasks.map((todo, index) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: 0.1 * index }}
                      className="card hover:bg-opacity-20 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="w-6 h-6 rounded-full border-2 border-white border-opacity-50 hover:border-opacity-100 transition-all flex items-center justify-center"
                        >
                          {todo.completed && <Check className="w-4 h-4 text-white" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(todo.priority).split(' ')[1]}`}></span>
                            <span className="text-white font-medium">{todo.text}</span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-white text-opacity-70">
                            <div className="flex items-center space-x-1">
                              <Flag className="w-4 h-4" />
                              <span className="capitalize">{todo.priority}</span>
                            </div>
                            
                            {todo.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="text-white text-opacity-50 hover:text-opacity-100 hover:text-red-400 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Completed Tasks</h2>
              <div className="space-y-3">
                {completedTasks.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="card bg-opacity-10"
                  >
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>

                      <div className="flex-1">
                        <span className="text-white text-opacity-70 line-through">{todo.text}</span>
                      </div>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-white text-opacity-50 hover:text-opacity-100 hover:text-red-400 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {state.todos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="card text-center py-12"
            >
              <div className="text-6xl mb-4">{themeData.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">No tasks yet!</h3>
              <p className="text-white text-opacity-70 mb-4">
                Create your first task to get started with your productivity journey.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
