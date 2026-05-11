import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const STATUS_CONFIG = {
  safe: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/20',
    label: 'Safe',
    dot: 'bg-green-400',
  },
  warning: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    glow: 'shadow-yellow-500/20',
    label: 'Warning',
    dot: 'bg-yellow-400',
  },
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20',
    label: 'Critical',
    dot: 'bg-red-400',
  },
};

const GAS_ICONS = {
  co2: '💨',
  smoke: '🔥',
  nh3: '⚗️',
  benzene: '☣️',
  alcohol: '🍶',
  temperature: '🌡️',
  humidity: '💧',
};

const GAS_LABELS = {
  co2: 'CO₂',
  smoke: 'Smoke',
  nh3: 'NH₃',
  benzene: 'Benzene',
  alcohol: 'Alcohol',
  temperature: 'Temperature',
  humidity: 'Humidity',
};

const SensorCard = ({ gasType, value, unit, status, previousValue, index }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.safe;
  const trend = previousValue !== undefined
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable'
    : 'stable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative glass-card p-5 border ${config.border} shadow-lg ${config.glow} overflow-hidden group cursor-default`}
    >
      {/* Background glow effect */}
      <div className={`absolute inset-0 ${config.bg} opacity-50 rounded-2xl`} />

      {/* Critical pulse animation */}
      {status === 'critical' && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/10 rounded-2xl"
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{GAS_ICONS[gasType]}</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                {GAS_LABELS[gasType]}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} border ${config.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'critical' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-end gap-2 mb-2">
          <motion.span
            key={value}
            initial={{ scale: 1.2, color: '#00d4ff' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.3 }}
            className={`font-mono text-3xl font-bold ${config.color}`}
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
          </motion.span>
          <span className="text-gray-500 text-sm mb-1">{unit}</span>

          {/* Trend indicator */}
          <div className="mb-1 ml-auto">
            {trend === 'up' && <TrendingUp size={14} className="text-red-400" />}
            {trend === 'down' && <TrendingDown size={14} className="text-green-400" />}
            {trend === 'stable' && <Minus size={14} className="text-gray-500" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / getMaxValue(gasType)) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              status === 'safe' ? 'bg-green-400' :
              status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const getMaxValue = (gasType) => {
  const maxValues = {
    co2: 5000,
    smoke: 1000,
    nh3: 100,
    benzene: 20,
    alcohol: 1000,
    temperature: 60,
    humidity: 100,
  };
  return maxValues[gasType] || 1000;
};

export default SensorCard;
