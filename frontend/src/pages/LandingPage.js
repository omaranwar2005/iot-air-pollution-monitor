import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Activity, Bell, Shield, Cpu, BarChart3, ArrowRight, Wifi } from 'lucide-react';

const features = [
  { icon: Activity, title: 'Real-time Monitoring', desc: 'Live sensor data via MQTT protocol with sub-second updates', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Instant notifications when pollution exceeds safe thresholds', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Historical charts, trends, and data export capabilities', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Shield, title: 'Secure & Authenticated', desc: 'JWT authentication with role-based access control', color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: Cpu, title: 'ESP32 Integration', desc: 'Direct hardware integration with MQ-135, MQ-2, DHT11 sensors', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Wifi, title: 'Global WAN Access', desc: 'Works over the internet, not just local network', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

const sensors = [
  { name: 'CO₂', icon: '💨', desc: 'Carbon Dioxide' },
  { name: 'Smoke', icon: '🔥', desc: 'Smoke Detection' },
  { name: 'NH₃', icon: '⚗️', desc: 'Ammonia' },
  { name: 'Benzene', icon: '☣️', desc: 'Benzene' },
  { name: 'Alcohol', icon: '🍶', desc: 'Alcohol Vapor' },
  { name: 'Temp', icon: '🌡️', desc: 'Temperature' },
  { name: 'Humidity', icon: '💧', desc: 'Humidity' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-dark-900 cyber-bg text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center neon-blue">
            <Wind size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">IoT Air Pollution</p>
            <p className="text-xs text-cyan-400 leading-tight">Monitor System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Advanced Networks University Project
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="gradient-text">IoT Air Quality</span>
            <br />
            <span className="text-white">Monitor System</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time air pollution monitoring using ESP32, MQTT protocol, and a modern
            React dashboard. Monitor CO₂, smoke, NH₃, benzene, alcohol, temperature, and humidity.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
              Launch Dashboard
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Sensor badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-16"
        >
          {sensors.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{s.name}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Everything you need to monitor air quality
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="glass-card p-6 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">System Architecture</h2>
          <p className="text-gray-500 mb-12">MQTT-based IoT communication pipeline</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'ESP32 + Sensors', icon: '🔌', color: 'border-green-500/30 bg-green-500/5' },
              { label: '→', icon: null, color: '' },
              { label: 'MQTT Broker', icon: '📡', color: 'border-cyan-500/30 bg-cyan-500/5' },
              { label: '→', icon: null, color: '' },
              { label: 'Node.js Backend', icon: '⚙️', color: 'border-blue-500/30 bg-blue-500/5' },
              { label: '→', icon: null, color: '' },
              { label: 'MongoDB', icon: '🗄️', color: 'border-purple-500/30 bg-purple-500/5' },
              { label: '→', icon: null, color: '' },
              { label: 'React Dashboard', icon: '📊', color: 'border-pink-500/30 bg-pink-500/5' },
            ].map((item, i) => (
              item.icon ? (
                <div key={i} className={`px-4 py-3 rounded-xl border ${item.color} text-center`}>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                </div>
              ) : (
                <span key={i} className="text-gray-600 text-xl font-bold">{item.label}</span>
              )
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass-card p-12 border border-cyan-500/20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to monitor?</h2>
          <p className="text-gray-500 mb-8">Create your account and start monitoring air quality in real time.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-6 text-center text-gray-600 text-sm">
        <p>IoT Air Pollution Monitor System — Advanced Networks University Project</p>
        <p className="mt-1">Built with React, Node.js, MQTT, MongoDB & ESP32</p>
      </footer>
    </div>
  );
};

export default LandingPage;
