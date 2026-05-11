import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { sensorAPI, alertAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SensorContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

const DEFAULT_READINGS = {
  co2:     { value: 0, unit: 'ppm', status: 'safe', gasType: 'co2' },
  smoke:   { value: 0, unit: 'ppm', status: 'safe', gasType: 'smoke' },
  nh3:     { value: 0, unit: 'ppm', status: 'safe', gasType: 'nh3' },
  benzene: { value: 0, unit: 'ppm', status: 'safe', gasType: 'benzene' },
  alcohol: { value: 0, unit: 'ppm', status: 'safe', gasType: 'alcohol' },
};

export const SensorProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [readings, setReadings]           = useState(DEFAULT_READINGS);
  const [aqi, setAqi]                     = useState({ aqi: 0, level: 'Good', color: '#00e400' });
  const [alerts, setAlerts]               = useState([]);
  const [unreadAlerts, setUnreadAlerts]   = useState(0);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [history, setHistory]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const socketRef = useRef(null);

  // ── fetch latest from REST (used on load + polling) ──────
  const fetchLatest = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await sensorAPI.getLatest();
      if (res.data.success && res.data.data) {
        setReadings(prev => {
          const updated = { ...prev };
          Object.entries(res.data.data).forEach(([key, val]) => {
            if (val) updated[key] = val;
          });
          return updated;
        });
      }
    } catch (e) {
      console.error('fetchLatest error:', e.message);
    }
  }, [isAuthenticated]);

  // ── fetch AQI ────────────────────────────────────────────
  const fetchAQI = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await sensorAPI.getAQI();
      if (res.data.success) setAqi(res.data);
    } catch {}
  }, [isAuthenticated]);

  // ── fetch MQTT status ─────────────────────────────────────
  const fetchMQTTStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res  = await fetch(`${SOCKET_URL}/api/mqtt/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setMqttConnected(json.connected === true);
    } catch {
      setMqttConnected(false);
    }
  }, []);

  // ── initial load ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const init = async () => {
      setLoading(true);
      try {
        const [latestRes, aqiRes, alertRes] = await Promise.all([
          sensorAPI.getLatest(),
          sensorAPI.getAQI(),
          alertAPI.getUnreadCount(),
        ]);
        if (latestRes.data.success && latestRes.data.data) {
          setReadings(prev => {
            const updated = { ...prev };
            Object.entries(latestRes.data.data).forEach(([key, val]) => {
              if (val) updated[key] = val;
            });
            return updated;
          });
        }
        if (aqiRes.data.success)   setAqi(aqiRes.data);
        if (alertRes.data.success) setUnreadAlerts(alertRes.data.count);
      } catch (e) {
        console.error('Init error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAuthenticated]);

  // ── Socket.IO + polling ───────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // ── Socket.IO ──
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
      withCredentials: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
      setSocketConnected(true);
      socket.emit('subscribe_sensors');
      fetchMQTTStatus();
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.log('Socket error:', err.message);
      setSocketConnected(false);
    });

    // Live sensor data pushed from backend
    socket.on('sensor_data', (data) => {
      console.log('📡 Live sensor_data received:', data);
      if (data.readings && Array.isArray(data.readings)) {
        setReadings((prev) => {
          const updated = { ...prev };
          data.readings.forEach((r) => {
            updated[r.gasType] = r;
          });
          return updated;
        });
        setHistory((prev) => {
          const entry = {
            timestamp: data.timestamp,
            ...data.readings.reduce((acc, r) => { acc[r.gasType] = r.value; return acc; }, {}),
          };
          return [...prev.slice(-49), entry];
        });
      }
    });

    socket.on('mqtt_status', (data) => {
      setMqttConnected(data.connected === true);
    });

    socket.on('new_alert', (data) => {
      if (data.alerts?.length > 0) {
        setUnreadAlerts((prev) => prev + data.alerts.length);
        setAlerts((prev) => [...data.alerts, ...prev].slice(0, 50));
        data.alerts.forEach((alert) => {
          if (alert.level === 'critical') {
            toast.error(`🚨 CRITICAL: ${alert.message}`, { duration: 8000 });
          } else if (alert.level === 'warning') {
            toast(`⚠️ WARNING: ${alert.message}`, {
              duration: 5000,
              style: { background: '#854d0e', color: '#fef08a' },
            });
          }
        });
      }
    });

    // ── Polling fallback every 4 seconds ──
    const pollInterval = setInterval(() => {
      fetchLatest();
    }, 4000);

    // ── AQI refresh every 30 seconds ──
    const aqiInterval = setInterval(() => {
      fetchAQI();
    }, 30000);

    // ── MQTT status every 10 seconds ──
    const mqttInterval = setInterval(() => {
      fetchMQTTStatus();
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
      clearInterval(aqiInterval);
      clearInterval(mqttInterval);
    };
  }, [isAuthenticated, fetchLatest, fetchAQI, fetchMQTTStatus]);

  const clearUnreadAlerts = useCallback(() => setUnreadAlerts(0), []);
  const refreshData = useCallback(() => {
    fetchLatest();
    fetchAQI();
  }, [fetchLatest, fetchAQI]);

  return (
    <SensorContext.Provider value={{
      readings, aqi, alerts, unreadAlerts,
      mqttConnected, socketConnected,
      history, loading,
      clearUnreadAlerts, refreshData,
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (!context) throw new Error('useSensor must be used within SensorProvider');
  return context;
};
