import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import { alertAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AlertBanner = ({ alerts, onDismiss }) => {
  const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.acknowledged);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledge(alertId);
      onDismiss(alertId);
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  };

  return (
    <AnimatePresence>
      {criticalAlerts.map((alert) => (
        <motion.div
          key={alert._id}
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative overflow-hidden rounded-xl border border-red-500/40 bg-red-500/10 backdrop-blur-md p-4 mb-3"
        >
          {/* Animated background */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/5"
          />

          <div className="relative flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
                  🚨 Critical Alert
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white text-sm">{alert.message}</p>
              <p className="text-gray-400 text-xs mt-1">Device: {alert.deviceId}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleAcknowledge(alert._id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors"
              >
                <CheckCircle size={12} />
                Acknowledge
              </button>
              <button
                onClick={() => onDismiss(alert._id)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default AlertBanner;
