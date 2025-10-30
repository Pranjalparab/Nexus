import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const initialState = {
  user: null,
  theme: 'kpop',
  isAuthenticated: false,
  focusSession: {
    isActive: false,
    duration: 25,
    timeLeft: 0,
    startTime: null,
    theme: 'kpop'
  },
  coins: 0,
  coupons: [],
  todos: [],
  calendar: [],
  history: [],
  settings: {
    notifications: true,
    cameraCheck: false,
    backgroundMusic: true,
    appBlocking: false,
    reminderVoice: true
  },
  blockedApps: [],
  chatbot: {
    isOpen: false,
    messages: []
  }
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    
    case 'LOGOUT':
      return {
        ...initialState
      };
    
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
    
    case 'START_FOCUS_SESSION':
      return {
        ...state,
        focusSession: {
          ...state.focusSession,
          isActive: true,
          duration: action.payload.duration,
          timeLeft: action.payload.duration * 60,
          startTime: new Date(),
          theme: action.payload.theme || state.theme
        }
      };
    
    case 'UPDATE_FOCUS_TIME':
      return {
        ...state,
        focusSession: {
          ...state.focusSession,
          timeLeft: action.payload
        }
      };
    
    case 'END_FOCUS_SESSION':
      const coinsEarned = Math.floor(state.focusSession.duration / 5);
      return {
        ...state,
        focusSession: {
          ...initialState.focusSession
        },
        coins: state.coins + coinsEarned,
        history: [
          ...state.history,
          {
            id: Date.now(),
            type: 'focus',
            duration: state.focusSession.duration,
            coinsEarned,
            date: new Date(),
            theme: state.focusSession.theme
          }
        ]
      };
    
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now(),
            text: action.payload.text,
            completed: false,
            createdAt: new Date(),
            priority: action.payload.priority || 'medium',
            dueDate: action.payload.dueDate
          }
        ]
      };
    
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    
    case 'ADD_CALENDAR_EVENT':
      return {
        ...state,
        calendar: [
          ...state.calendar,
          {
            id: Date.now(),
            title: action.payload.title,
            date: action.payload.date,
            time: action.payload.time,
            description: action.payload.description,
            reminder: action.payload.reminder
          }
        ]
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    case 'REDEEM_COUPON':
      const coupon = action.payload;
      if (state.coins >= coupon.cost) {
        return {
          ...state,
          coins: state.coins - coupon.cost,
          coupons: [
            ...state.coupons,
            {
              ...coupon,
              id: Date.now(),
              redeemedAt: new Date()
            }
          ]
        };
      }
      return state;
    
    case 'TOGGLE_CHATBOT':
      return {
        ...state,
        chatbot: {
          ...state.chatbot,
          isOpen: !state.chatbot.isOpen
        }
      };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatbot: {
          ...state.chatbot,
          messages: [
            ...state.chatbot.messages,
            {
              id: Date.now(),
              text: action.payload.text,
              sender: action.payload.sender,
              timestamp: new Date()
            }
          ]
        }
      };
    
    case 'BLOCK_APPS':
      return {
        ...state,
        blockedApps: action.payload
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('flowgenix-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        Object.keys(parsedState).forEach(key => {
          if (key === 'user' && parsedState[key]) {
            dispatch({ type: 'LOGIN', payload: parsedState[key] });
          } else if (key === 'theme') {
            dispatch({ type: 'SET_THEME', payload: parsedState[key] });
          }
          // Add more state restoration as needed
        });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      user: state.user,
      theme: state.theme,
      coins: state.coins,
      todos: state.todos,
      calendar: state.calendar,
      history: state.history,
      settings: state.settings,
      coupons: state.coupons
    };
    localStorage.setItem('flowgenix-state', JSON.stringify(stateToSave));
  }, [state]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    state,
    dispatch,
    // Helper functions
    login: (user) => dispatch({ type: 'LOGIN', payload: user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    startFocusSession: (config) => dispatch({ type: 'START_FOCUS_SESSION', payload: config }),
    endFocusSession: () => dispatch({ type: 'END_FOCUS_SESSION' }),
    addTodo: (todo) => dispatch({ type: 'ADD_TODO', payload: todo }),
    toggleTodo: (id) => dispatch({ type: 'TOGGLE_TODO', payload: id }),
    deleteTodo: (id) => dispatch({ type: 'DELETE_TODO', payload: id }),
    addCalendarEvent: (event) => dispatch({ type: 'ADD_CALENDAR_EVENT', payload: event }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    redeemCoupon: (coupon) => dispatch({ type: 'REDEEM_COUPON', payload: coupon }),
    toggleChatbot: () => dispatch({ type: 'TOGGLE_CHATBOT' }),
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message })
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
