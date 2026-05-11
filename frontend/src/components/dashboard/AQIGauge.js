import React from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const AQI_LEVELS = [
  { range: [0, 50], label: 'Good', color: '#00e400', description: 'Air quality is satisfactory' },
  { range: [51, 100], label: 'Moderate', color: '#ffff00', description: 'Acceptable air quality' },
  { range: [101, 150], label: 'Unhealthy (Sensitive)', color: '#ff7e00', description: 'Sensitive groups affected' },
  { range: [151, 200], label: 'Unhealthy', color: '#ff0000', description: 'Everyone may be affected' },
  { range: [201, 300], label: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert' },
  { range: [301, 500], label: 'Hazardous', color: '#7e0023', description: 'Emergency conditions' },
];

const getAQIInfo = (aqi) => {
  return AQI_LEVELS.find(l => aqi >= l.range[0] && aqi <= l.range[1]) || AQI_LEVELS[0];
};

const AQIGauge = ({ aqi = 0, level = 'Good', color = '#00e400' }) => {
  const aqiInfo = getAQIInfo(aqi);
  const percentage = Math.min((aqi / 500) * 100, 100);

  const data = [
    { name: 'AQI', value: percentage, fill: aqiInfo.color },
    { name: 'Remaining', value: 100 - percentage, fill: 'rgba(255,255,255,0.05)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 border border-white/10 flex flex-col items-center"
    >
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Air Quality Index
      </h3>

      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={aqi}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="font-mono text-4xl font-bold"
            style={{ color: aqiInfo.color }}
          >
            {Math.round(aqi)}
          </motion.span>
          <span className="text-xs text-gray-500 mt-1">AQI</span>
        </div>
      </div>

      {/* Level badge */}
      <motion.div
        key={aqiInfo.label}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 px-4 py-2 rounded-full border text-sm font-semibold"
        style={{
          color: aqiInfo.color,
          borderColor: `${aqiInfo.color}40`,
          backgroundColor: `${aqiInfo.color}15`,
        }}
      >
        {aqiInfo.label}
      </motion.div>

      <p className="text-xs text-gray-500 mt-2 text-center">{aqiInfo.description}</p>

      {/* AQI Scale */}
      <div className="w-full mt-4 flex rounded-full overflow-hidden h-2">
        {AQI_LEVELS.map((l, i) => (
          <div
            key={i}
            className="flex-1 h-full"
            style={{ backgroundColor: l.color }}
          />
        ))}
      </div>
      <div className="w-full flex justify-between text-xs text-gray-600 mt-1">
        <span>0</span>
        <span>100</span>
        <span>200</span>
        <span>300</span>
        <span>500</span>
      </div>
    </motion.div>
  );
};

export default AQIGauge;
