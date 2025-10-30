import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, ShoppingBag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Rewards = () => {
  const { state, redeemCoupon } = useApp();

  const getThemeData = () => {
    const themes = {
      kpop: { gradient: 'bg-gradient-kpop', icon: '🌟' },
      anime: { gradient: 'bg-gradient-anime', icon: '⚡' },
      car: { gradient: 'bg-gradient-car', icon: '🏎️' },
      music: { gradient: 'bg-gradient-music', icon: '🎵' }
    };
    return themes[state.theme] || themes.kpop;
  };

  const availableRewards = [
    { id: 1, name: 'Coffee Break', cost: 50, description: '15 min coffee break coupon', emoji: '☕' },
    { id: 2, name: 'Movie Night', cost: 100, description: 'Watch your favorite movie', emoji: '🎬' },
    { id: 3, name: 'Snack Time', cost: 25, description: 'Treat yourself to a snack', emoji: '🍿' },
    { id: 4, name: 'Music Session', cost: 30, description: 'Listen to music for 30 min', emoji: '🎵' },
    { id: 5, name: 'Social Media', cost: 75, description: '20 min social media time', emoji: '📱' },
    { id: 6, name: 'Gaming Break', cost: 120, description: '1 hour gaming session', emoji: '🎮' }
  ];

  const themeData = getThemeData();

  return (
    <div className={`min-h-screen p-4 ${themeData.gradient}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 text-shadow">
            {themeData.icon} Rewards Store
          </h1>
          <p className="text-white text-opacity-80 mb-6">
            Exchange your focus coins for rewards!
          </p>
          
          <div className="card inline-block">
            <div className="flex items-center space-x-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{state.coins}</span>
              <span className="text-white text-opacity-70">Focus Coins</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRewards.map((reward, index) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card hover:scale-105 transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{reward.emoji}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{reward.name}</h3>
                <p className="text-white text-opacity-70 text-sm mb-4">{reward.description}</p>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-white">{reward.cost}</span>
                </div>
                
                <button
                  onClick={() => redeemCoupon(reward)}
                  disabled={state.coins < reward.cost}
                  className={`btn-primary w-full ${
                    state.coins >= reward.cost
                      ? (state.theme === 'kpop' ? 'btn-kpop' :
                         state.theme === 'anime' ? 'btn-anime' :
                         state.theme === 'car' ? 'btn-car' : 'btn-music')
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {state.coins >= reward.cost ? 'Redeem' : 'Not Enough Coins'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* My Coupons */}
        {state.coupons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">My Coupons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.coupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="card bg-green-500 bg-opacity-20 border-2 border-green-400 border-opacity-50"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{coupon.emoji}</div>
                    <h3 className="text-lg font-semibold text-white">{coupon.name}</h3>
                    <p className="text-white text-opacity-70 text-sm">
                      Redeemed: {new Date(coupon.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
