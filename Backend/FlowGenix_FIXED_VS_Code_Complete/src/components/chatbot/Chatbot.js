import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Chatbot = () => {
  const { state, toggleChatbot, addChatMessage } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatbot.messages]);

  const getThemeClasses = () => {
    const themes = {
      kpop: 'from-kpop-primary to-kpop-secondary',
      anime: 'from-anime-primary to-anime-secondary',
      car: 'from-car-primary to-car-secondary',
      music: 'from-music-primary to-music-secondary'
    };
    return themes[state.theme] || themes.kpop;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    addChatMessage({ text: userMessage, sender: 'user' });

    // Simulate AI typing
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      addChatMessage({ text: aiResponse, sender: 'ai' });
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Simple response logic (in real app, integrate with OpenAI/Gemini API)
    if (message.includes('focus') || message.includes('study')) {
      const responses = [
        "Great! Starting a focus session can really boost your productivity. Would you like to begin a 25-minute Pomodoro session?",
        "Focus is key to success! Remember to eliminate distractions and take breaks every 25 minutes.",
        "I recommend trying the focus timer with your current theme. It's designed to help you stay concentrated!"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (message.includes('motivation') || message.includes('motivated')) {
      const responses = [
        "You've got this! Remember, every small step counts towards your goals. 💪",
        "Stay strong! Your future self will thank you for the hard work you're putting in today.",
        "Believe in yourself! You've overcome challenges before, and you can do it again."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (message.includes('task') || message.includes('todo')) {
      return "Managing tasks effectively is crucial! Have you checked your todo list? You can add new tasks and set priorities to stay organized.";
    }
    
    if (message.includes('reward') || message.includes('coin')) {
      return `You currently have ${state.coins} focus coins! You can use them in the rewards section to unlock coupons and treats. Keep focusing to earn more!`;
    }
    
    if (message.includes('theme')) {
      return "I see you're interested in themes! You can change your theme in the Themes section. Each theme has its own vibe - K-Pop for energy, Anime for power, Car for speed, and Music for creativity!";
    }
    
    // Default responses
    const defaultResponses = [
      "That's interesting! How can I help you stay focused today?",
      "I'm here to help you with your productivity journey. What would you like to know?",
      "Great question! Is there something specific about focus or productivity you'd like help with?",
      "I'm your FlowGenix assistant! I can help with focus sessions, task management, and motivation."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const quickQuestions = [
    "How do I start focusing?",
    "Give me motivation",
    "What are focus coins?",
    "How do themes work?"
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!state.chatbot.isOpen && (
        <motion.button
          onClick={toggleChatbot}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r ${getThemeClasses()} text-white shadow-lg hover:shadow-xl transition-all z-50`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <MessageCircle className="w-6 h-6 mx-auto" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {state.chatbot.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white bg-opacity-10 backdrop-blur-md rounded-2xl border border-white border-opacity-20 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${getThemeClasses()} p-4 rounded-t-2xl flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">FlowGenix Assistant</span>
              </div>
              <button
                onClick={toggleChatbot}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {state.chatbot.messages.length === 0 && (
                <div className="text-center text-white text-opacity-70 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-white text-opacity-50" />
                  <p className="mb-4">Hi! I'm your FlowGenix assistant. How can I help you focus better today?</p>
                  
                  {/* Quick Questions */}
                  <div className="space-y-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          addChatMessage({ text: question, sender: 'user' });
                          setTimeout(() => {
                            const response = generateAIResponse(question);
                            addChatMessage({ text: response, sender: 'ai' });
                          }, 1000);
                        }}
                        className="block w-full text-left text-sm text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10 rounded-lg px-3 py-2 transition-all"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.chatbot.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? `bg-gradient-to-r ${getThemeClasses()}`
                        : 'bg-white bg-opacity-20'
                    }`}>
                      {message.sender === 'user' ? 
                        <User className="w-4 h-4 text-white" /> : 
                        <Bot className="w-4 h-4 text-white" />
                      }
                    </div>
                    
                    <div className={`px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? `bg-gradient-to-r ${getThemeClasses()} text-white`
                        : 'bg-white bg-opacity-20 text-white'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white border-opacity-20">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about focus and productivity..."
                  className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-opacity-50"
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className={`p-2 rounded-lg bg-gradient-to-r ${getThemeClasses()} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
