import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Filter, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { alertAPI } from '../services/api';
import { useSensor } from '../context/SensorContext';
import toast from 'react-hot-toast';

const LEVEL_CONFIG = {
  safe: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { clearUnreadAlerts } = useSensor();

  useEffect(() => {
    clearUnreadAlerts();
    fetchAlerts();
    fetchStats();
  }, [filter, page]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 20, page };
      if (filter !== 'all') {
        if (filter === 'unread') params.acknowledged = false;
        else params.level = filter;
      }
      const res = await alertAPI.getAlerts(params);
      setAlerts(res.data.data);
      setTotalPages(res.data.pages);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await alertAPI.getStats();
      setStats(res.data);
    } catch {}
  };

  const handleAcknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await alertAPI.acknowledgeAll();
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
      toast.success('All alerts acknowledged');
    } catch {
      toast.error('Failed to acknowledge all');
    }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
  ];

  return (
    <Layout title="Alerts" subtitle="Alert history and notifications">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Alerts', value: stats.total || 0, color: 'text-white' },
          { label: 'Unacknowledged', value: stats.unacknowledged || 0, color: 'text-yellow-400' },
          { label: 'Critical', value: stats.byLevel?.find(l => l._id === 'critical')?.count || 0, color: 'text-red-400' },
          { label: 'Warnings', value: stats.byLevel?.find(l => l._id === 'warning')?.count || 0, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 border border-white/10"
          >
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 p-1 bg-dark-700 rounded-xl border border-white/5">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleAcknowledgeAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 border border-white/5 text-gray-400 hover:text-white transition-all text-sm"
        >
          <CheckCheck size={14} />
          Acknowledge All
        </button>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Bell size={40} className="mb-3 opacity-30" />
          <p>No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const config = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.warning;
              const Icon = config.icon;
              return (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card p-4 border ${config.border} ${alert.acknowledged ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                          {alert.level}
                        </span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500 capitalize">{alert.gasType}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {alert.acknowledged && (
                          <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle size={10} /> Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">Device: {alert.deviceId}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 border border-white/5 text-gray-400 hover:text-white text-xs transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AlertsPage;
