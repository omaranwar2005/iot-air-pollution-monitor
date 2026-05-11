import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Database, Shield, Trash2, ToggleLeft, ToggleRight, Crown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const res = await adminAPI.toggleUserActive(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Delete sensor data older than 30 days?')) return;
    try {
      const res = await adminAPI.cleanupData(30);
      toast.success(res.data.message);
    } catch {
      toast.error('Cleanup failed');
    }
  };

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Total Readings', value: stats.totalReadings, icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Alerts', value: stats.totalAlerts, icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: "Today's Readings", value: stats.todayReadings, icon: Database, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Online Devices', value: `${stats.onlineDevices}/${stats.totalDevices}`, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <Layout title="Admin Panel" subtitle="System administration">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-dark-700 rounded-xl border border-white/5 w-fit">
        {['overview', 'users', 'data'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {STAT_CARDS.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <card.icon size={16} className={card.color} />
                    </div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                  <p className={`text-3xl font-mono font-bold ${card.color}`}>{card.value ?? '—'}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {users.map((user, i) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 border border-white/10 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white text-sm">{user.name}</p>
                      {user.role === 'admin' && <Crown size={12} className="text-yellow-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className="bg-dark-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleToggleActive(user._id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        user.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-white'
                      }`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="glass-card p-6 border border-white/10">
                <h3 className="text-base font-semibold text-white mb-2">Data Cleanup</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Remove sensor readings older than 30 days to free up database space.
                </p>
                <button
                  onClick={handleCleanup}
                  className="btn-danger flex items-center gap-2 text-sm py-2"
                >
                  <Trash2 size={14} />
                  Clean Old Data (30+ days)
                </button>
              </div>

              <div className="glass-card p-6 border border-white/10">
                <h3 className="text-base font-semibold text-white mb-2">Database Stats</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="p-3 bg-dark-700 rounded-xl">
                    <p className="text-xs text-gray-500">Total Readings</p>
                    <p className="text-xl font-mono font-bold text-cyan-400">{stats.totalReadings?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-dark-700 rounded-xl">
                    <p className="text-xs text-gray-500">Today's Readings</p>
                    <p className="text-xl font-mono font-bold text-green-400">{stats.todayReadings?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default AdminPage;
