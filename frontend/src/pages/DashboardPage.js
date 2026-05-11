import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useSensor } from '../context/SensorContext';
import { sensorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

// Status config
const STATUS = {
  safe:     { color: '#00ff88', bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'SAFE',      dot: 'bg-green-400' },
  warning:  { color: '#facc15', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'WARNING',   dot: 'bg-yellow-400' },
  critical: { color: '#f87171', bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'DANGEROUS', dot: 'bg-red-400' },
};

const getStatus = (raw, warnThresh, dangerThresh) => {
  if (raw >= dangerThresh) return 'critical';
  if (raw >= warnThresh)   return 'warning';
  return 'safe';
};

const RawSensorCard = ({ label, rawValue, warnThresh, dangerThresh, color, index }) => {
  const status = getStatus(rawValue, warnThresh, dangerThresh);
  const cfg    = STATUS[status];
  const pct    = Math.min((rawValue / 4095) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative glass-card p-6 border ${cfg.border} overflow-hidden`}
    >
      {status === 'critical' && (
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/10"
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{label}</h3>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} border ${cfg.border}`}
            style={{ color: cfg.color }}>
            <div className={`w-2 h-2 rounded-full ${cfg.dot} ${status !== 'safe' ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </div>
        </div>

        {/* Big raw value */}
        <motion.div
          key={rawValue}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-center my-4"
        >
          <span
            className="font-mono font-black"
            style={{ fontSize: '4rem', lineHeight: 1, color: cfg.color }}
          >
            {rawValue}
          </span>
          <p className="text-gray-500 text-sm mt-1">raw analog (0 – 4095)</p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full bg-dark-600 rounded-full h-3 overflow-hidden mt-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0</span>
          <span className="text-yellow-600">warn {warnThresh}</span>
          <span className="text-red-600">danger {dangerThresh}</span>
          <span>4095</span>
        </div>
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {payload.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-gray-300">{e.name}:</span>
            <span className="font-mono font-bold" style={{ color: e.color }}>{e.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const { readings, history, loading, mqttConnected, socketConnected } = useSensor();
  const { user } = useAuth();
  const [simulating, setSimulating] = useState(false);

  const mq135Raw = readings.mq135_raw?.value ?? readings.co2?.rawValue ?? 0;
  const mq2Raw   = readings.mq2_raw?.value  ?? readings.smoke?.rawValue ?? 0;

  const overallStatus = getStatus(
    Math.max(mq135Raw / 4095, mq2Raw / 4095) * 4095,
    1500, 2500
  );
  const overallCfg = STATUS[overallStatus];

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await sensorAPI.simulate();
      toast.success('Simulated data sent!');
    } catch {
      toast.error('Simulation failed — check MQTT');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Layout title="Air Quality Dashboard" subtitle="Live sensor readings from ESP32">

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
          mqttConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          MQTT {mqttConnected ? 'Live' : 'Offline'}
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
          socketConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {socketConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          Socket {socketConnected ? 'Connected' : 'Disconnected'}
        </div>

        {user?.role === 'admin' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSimulate}
            disabled={simulating}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-sm font-medium"
          >
            {simulating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            Simulate Data
          </motion.button>
        )}
      </div>

      {/* Overall Air Quality Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-6 border ${overallCfg.border} mb-6 text-center`}
        style={{ boxShadow: `0 0 30px ${overallCfg.color}20` }}
      >
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Overall Air Quality</p>
        <motion.p
          key={overallStatus}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-5xl font-black tracking-wider"
          style={{ color: overallCfg.color }}
        >
          {overallCfg.label}
        </motion.p>
        <p className="text-gray-500 text-xs mt-2">
          Updated every 3 seconds from ESP32
        </p>
      </motion.div>

      {/* Two big raw sensor cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[0, 1].map(i => (
            <div key={i} className="glass-card p-6 h-48 animate-pulse border border-white/5">
              <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
              <div className="h-16 bg-white/5 rounded mb-4" />
              <div className="h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <RawSensorCard
            label="MQ-135 Air Quality Sensor"
            rawValue={mq135Raw}
            warnThresh={1800}
            dangerThresh={2800}
            color="#00d4ff"
            index={0}
          />
          <RawSensorCard
            label="MQ-2 Sensor"
            rawValue={mq2Raw}
            warnThresh={1500}
            dangerThresh={2500}
            color="#ff6b35"
            index={1}
          />
        </div>
      )}

      {/* Live chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-cyan-400" />
          <h3 className="text-base font-semibold text-white">Live Raw Sensor Chart</h3>
          <span className="text-xs text-gray-500 ml-2">last 50 readings</span>
        </div>

        {history.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
            Waiting for sensor data...
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history.map((h, i) => ({
                  t: i,
                  MQ135: h.mq135_raw ?? h.co2 ?? 0,
                  MQ2:   h.mq2_raw  ?? h.smoke ?? 0,
                }))}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="g135" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={false} axisLine={false} />
                <YAxis domain={[0, 4095]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="MQ135" stroke="#00d4ff" strokeWidth={2} fill="url(#g135)" dot={false} />
                <Area type="monotone" dataKey="MQ2"   stroke="#ff6b35" strokeWidth={2} fill="url(#g2)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-3 justify-center">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-gray-400">MQ-135 (Air Quality)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-gray-400">MQ-2</span>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default DashboardPage;
