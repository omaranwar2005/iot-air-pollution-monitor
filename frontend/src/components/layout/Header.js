import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSensor } from '../../context/SensorContext';
import { useAuth } from '../../context/AuthContext';

const Header = ({ title, subtitle }) => {
  const [darkMode, setDarkMode] = useState(true);
  const { unreadAlerts, mqttConnected, socketConnected, refreshData } = useSensor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Connection indicators */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5">
          <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400">MQTT</span>
          {socketConnected ? (
            <Wifi size={12} className="text-green-400 ml-1" />
          ) : (
            <WifiOff size={12} className="text-red-400 ml-1" />
          )}
        </div>

        {/* Refresh button */}
        <motion.button
          whileTap={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          onClick={handleRefresh}
          className="w-9 h-9 rounded-xl bg-dark-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all"
          title="Refresh data"
        >
          <RefreshCw size={15} />
        </motion.button>

        {/* Alerts bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative w-9 h-9 rounded-xl bg-dark-700 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all"
        >
          <Bell size={15} />
          {unreadAlerts > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </motion.span>
          )}
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
