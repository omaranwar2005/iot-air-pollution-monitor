import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Plus, Wifi, WifiOff, Clock, MapPin, Trash2, Edit, Send } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { deviceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ deviceId: '', deviceName: '', location: '', description: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await deviceAPI.getDevices();
      setDevices(res.data.data);
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      await deviceAPI.register(newDevice);
      toast.success('Device registered successfully');
      setShowAddModal(false);
      setNewDevice({ deviceId: '', deviceName: '', location: '', description: '' });
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register device');
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('Delete this device?')) return;
    try {
      await deviceAPI.delete(deviceId);
      toast.success('Device deleted');
      fetchDevices();
    } catch {
      toast.error('Failed to delete device');
    }
  };

  const handleSendCommand = async (deviceId, command) => {
    try {
      await deviceAPI.sendCommand(deviceId, { command });
      toast.success(`Command '${command}' sent`);
    } catch {
      toast.error('Failed to send command');
    }
  };

  return (
    <Layout title="Devices" subtitle="IoT device management">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 text-sm text-gray-400">
            {devices.filter(d => d.isOnline).length} / {devices.length} online
          </div>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2"
          >
            <Plus size={16} />
            Register Device
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Cpu size={40} className="mb-3 opacity-30" />
          <p>No devices registered</p>
          {user?.role === 'admin' && (
            <button onClick={() => setShowAddModal(true)} className="mt-3 text-cyan-400 text-sm hover:underline">
              Register your first device
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device, i) => (
            <motion.div
              key={device._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 border transition-all ${
                device.isOnline
                  ? 'border-green-500/20 hover:border-green-500/40'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    device.isOnline ? 'bg-green-500/20' : 'bg-dark-600'
                  }`}>
                    <Cpu size={18} className={device.isOnline ? 'text-green-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{device.deviceName}</h3>
                    <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  device.isOnline
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-dark-600 text-gray-500 border border-white/5'
                }`}>
                  {device.isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {device.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {device.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} />
                    {device.location}
                  </div>
                )}
                {device.lastSeen && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    Last seen: {new Date(device.lastSeen).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Firmware: v{device.firmware}</span>
                </div>
              </div>

              {/* Sensors */}
              <div className="flex gap-2 mb-4">
                {Object.entries(device.sensors || {}).map(([sensor, active]) => (
                  <span
                    key={sensor}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      active ? 'bg-cyan-500/10 text-cyan-400' : 'bg-dark-600 text-gray-600'
                    }`}
                  >
                    {sensor.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Actions */}
              {user?.role === 'admin' && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleSendCommand(device.deviceId, 'restart')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 border border-white/5 text-gray-400 hover:text-white text-xs transition-all"
                  >
                    <Send size={10} />
                    Restart
                  </button>
                  <button
                    onClick={() => handleSendCommand(device.deviceId, 'calibrate')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 border border-white/5 text-gray-400 hover:text-white text-xs transition-all"
                  >
                    Calibrate
                  </button>
                  <button
                    onClick={() => handleDelete(device.deviceId)}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-all"
                  >
                    <Trash2 size={10} />
                    Delete
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-white/10 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">Register New Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              {[
                { field: 'deviceId', label: 'Device ID', placeholder: 'ESP32_001' },
                { field: 'deviceName', label: 'Device Name', placeholder: 'Lab Sensor 1' },
                { field: 'location', label: 'Location', placeholder: 'Lab Room 1' },
                { field: 'description', label: 'Description', placeholder: 'Optional description' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  <input
                    type="text"
                    value={newDevice[field]}
                    onChange={e => setNewDevice(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    required={field !== 'description'}
                    className="input-field"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Register
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default DevicesPage;
