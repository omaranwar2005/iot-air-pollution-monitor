import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useSensor } from '../context/SensorContext';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { mqttConnected } = useSensor();
  const [notifications, setNotifications] = useState({
    browser: true,
    sound: true,
    criticalOnly: false,
  });

  const handleSave = () => {
    toast.success('Settings saved');
  };

  return (
    <Layout title="Settings" subtitle="Application configuration">
      <div className="max-w-2xl space-y-6">

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-white/10"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={16} className="text-cyan-400" />
            Connection Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'MQTT Broker',  status: mqttConnected, detail: '6a26fa415a8247d9b95acb545d636135.s1.eu.hivemq.cloud' },
              { label: 'WebSocket',    status: true,          detail: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001' },
              { label: 'REST API',     status: true,          detail: process.env.REACT_APP_API_URL    || 'http://localhost:5001/api' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.detail}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  item.status
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {item.status ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 border border-white/10"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={16} className="text-cyan-400" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'browser',      label: 'Browser Notifications', desc: 'Show desktop notifications for alerts' },
              { key: 'sound',        label: 'Sound Alerts',          desc: 'Play sound when critical alert triggers' },
              { key: 'criticalOnly', label: 'Critical Alerts Only',  desc: 'Only notify for critical level alerts' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[key] ? 'bg-cyan-500' : 'bg-dark-500'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications[key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={14} />
          Save Settings
        </button>
      </div>
    </Layout>
  );
};

export default SettingsPage;
