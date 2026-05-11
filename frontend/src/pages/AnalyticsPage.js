import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, Calendar, Filter } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { sensorAPI } from '../services/api';
import toast from 'react-hot-toast';

const GAS_COLORS = {
  co2: '#00d4ff', smoke: '#ff6b35', nh3: '#a855f7',
  benzene: '#f59e0b', alcohol: '#ec4899', temperature: '#ef4444', humidity: '#3b82f6',
};

const GAS_OPTIONS = [
  { value: 'co2', label: 'CO₂' },
  { value: 'smoke', label: 'Smoke' },
  { value: 'nh3', label: 'NH₃' },
  { value: 'benzene', label: 'Benzene' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'humidity', label: 'Humidity' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="font-mono font-bold" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const [selectedGas, setSelectedGas] = useState('co2');
  const [timeRange, setTimeRange] = useState('24h');
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { value: '6h', label: '6H', hours: 6 },
    { value: '24h', label: '24H', hours: 24 },
    { value: '7d', label: '7D', hours: 168 },
    { value: '30d', label: '30D', hours: 720 },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedGas, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const range = timeRanges.find(r => r.value === timeRange);
      const hours = range?.hours || 24;

      const [hourlyRes, dailyRes] = await Promise.all([
        sensorAPI.getHourlyAnalytics({ gasType: selectedGas, hours }),
        sensorAPI.getDailyAnalytics({ gasType: selectedGas, days: Math.ceil(hours / 24) }),
      ]);

      // Format hourly data
      const formatted = hourlyRes.data.data.map(d => ({
        time: `${String(d._id.hour).padStart(2, '0')}:00`,
        avg: parseFloat(d.avgValue?.toFixed(2)),
        max: parseFloat(d.maxValue?.toFixed(2)),
        min: parseFloat(d.minValue?.toFixed(2)),
        count: d.count,
      }));
      setHourlyData(formatted);

      // Format daily data
      const formattedDaily = dailyRes.data.data.map(d => ({
        date: `${d._id.month}/${d._id.day}`,
        avg: parseFloat(d.avgValue?.toFixed(2)),
        max: parseFloat(d.maxValue?.toFixed(2)),
        min: parseFloat(d.minValue?.toFixed(2)),
      }));
      setDailyData(formattedDaily);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const range = timeRanges.find(r => r.value === timeRange);
      const res = await sensorAPI.exportCSV({ gasType: selectedGas, hours: range?.hours || 24 });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sensor_data_${selectedGas}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  const color = GAS_COLORS[selectedGas];

  return (
    <Layout title="Analytics" subtitle="Historical sensor data analysis">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Gas selector */}
        <div className="flex items-center gap-2 p-1 bg-dark-700 rounded-xl border border-white/5">
          {GAS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedGas(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedGas === opt.value
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-white'
              }`}
              style={selectedGas === opt.value ? {
                backgroundColor: `${GAS_COLORS[opt.value]}20`,
                color: GAS_COLORS[opt.value],
              } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1 p-1 bg-dark-700 rounded-xl border border-white/5">
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 border border-white/5 text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all text-sm ml-auto"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-10 h-10" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hourly trend - Area chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color }} />
              <h3 className="text-base font-semibold text-white">
                {GAS_OPTIONS.find(g => g.value === selectedGas)?.label} — Hourly Trend
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color }}>{v}</span>} />
                  <Area type="monotone" dataKey="avg" name="Average" stroke={color} strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                  <Line type="monotone" dataKey="max" name="Max" stroke={`${color}80`} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="min" name="Min" stroke={`${color}40`} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Daily bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} style={{ color }} />
              <h3 className="text-base font-semibold text-white">Daily Averages</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg" name="Daily Avg" fill={color} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  <Bar dataKey="max" name="Daily Max" fill={`${color}50`} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Stats summary */}
          {hourlyData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Average', value: (hourlyData.reduce((s, d) => s + d.avg, 0) / hourlyData.length).toFixed(1) },
                { label: 'Maximum', value: Math.max(...hourlyData.map(d => d.max)).toFixed(1) },
                { label: 'Minimum', value: Math.min(...hourlyData.map(d => d.min)).toFixed(1) },
                { label: 'Data Points', value: hourlyData.reduce((s, d) => s + d.count, 0) },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-4 border border-white/10 text-center">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-mono font-bold" style={{ color }}>{stat.value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default AnalyticsPage;
