import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { sensorAPI } from '../../services/api';

const GAS_COLORS = {
  co2: '#00d4ff',
  smoke: '#ff6b35',
  nh3: '#a855f7',
  benzene: '#f59e0b',
  alcohol: '#ec4899',
  temperature: '#ef4444',
  humidity: '#3b82f6',
};

const GAS_LABELS = {
  co2: 'CO₂ (ppm)',
  smoke: 'Smoke (ppm)',
  nh3: 'NH₃ (ppm)',
  benzene: 'Benzene (ppm)',
  alcohol: 'Alcohol (ppm)',
  temperature: 'Temp (°C)',
  humidity: 'Humidity (%)',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="font-mono font-bold" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const LiveChart = ({ selectedGases = ['co2', 'smoke'], hours = 6, liveData = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const promises = selectedGases.map(gas =>
          sensorAPI.getHistory({ gasType: gas, hours, limit: 100 })
        );
        const results = await Promise.all(promises);

        // Merge data by timestamp
        const merged = {};
        results.forEach((res, idx) => {
          const gas = selectedGases[idx];
          res.data.data.forEach(reading => {
            const time = new Date(reading.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit'
            });
            if (!merged[time]) merged[time] = { time };
            merged[time][gas] = reading.value;
          });
        });

        const sorted = Object.values(merged).sort((a, b) =>
          new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
        );

        setChartData(sorted.slice(-50));
      } catch (error) {
        console.error('Failed to fetch chart history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedGases, hours]);

  // Merge live data
  useEffect(() => {
    if (liveData.length > 0) {
      const latest = liveData[liveData.length - 1];
      if (latest) {
        const time = new Date(latest.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit'
        });
        setChartData(prev => {
          const newEntry = { time };
          selectedGases.forEach(gas => {
            if (latest[gas] !== undefined) newEntry[gas] = latest[gas];
          });
          const updated = [...prev, newEntry];
          return updated.slice(-50);
        });
      }
    }
  }, [liveData, selectedGases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            {selectedGases.map(gas => (
              <linearGradient key={gas} id={`gradient-${gas}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GAS_COLORS[gas]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GAS_COLORS[gas]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            formatter={(value) => (
              <span style={{ color: GAS_COLORS[value] }}>{GAS_LABELS[value]}</span>
            )}
          />
          {selectedGases.map(gas => (
            <Area
              key={gas}
              type="monotone"
              dataKey={gas}
              name={gas}
              stroke={GAS_COLORS[gas]}
              strokeWidth={2}
              fill={`url(#gradient-${gas})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default LiveChart;
