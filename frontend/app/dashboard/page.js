'use client';

import { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Battery, 
  Wind, 
  MapPin, 
  RefreshCw, 
  LogOut, 
  TrendingUp, 
  Zap,
  BellRing,
  ShieldCheck
} from 'lucide-react';

export default function SmartBinDashboard() {
  const [user, setUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('--:--:--');
  const [filter, setFilter] = useState('ALL');
  const [bins, setBins] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchBinsData();
    const interval = setInterval(fetchBinsData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBinsData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bins');
      const data = await res.json();
      
      if (res.ok) {
        const formattedBins = data.map((b) => ({
          id: b.binId,
          location: b.location,
          fillLevel: b.fillLevel,
          battery: b.batteryLevel,
          odorLevel: b.fillLevel >= 95 ? 'High (420 ppm)' : b.fillLevel >= 75 ? 'Moderate (230 ppm)' : 'Normal (90 ppm)',
          status: b.status,
          lastEmptied: b.lastEmptied,
          coordinates: '25.6112° N, 85.1442° E',
          assignedOfficer: b.assignedOfficer,
          alertSent: b.alertSent
        }));

        setBins(formattedBins);
        
        const criticalBins = formattedBins.filter(b => b.fillLevel >= 95);
        const logs = criticalBins.map(b => ({
          id: b.id,
          time: new Date().toLocaleTimeString(),
          message: `🚨 Alert dispatched to ${b.assignedOfficer?.name || 'Officer'} (${b.assignedOfficer?.phone || ''}) for ${b.id} (${b.location}) at ${b.fillLevel}% capacity!`
        }));
        setAlertLogs(logs);

        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching IoT telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCleaned = async (binId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bins/${binId}/clean`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Work Done! ${binId} has been marked as cleaned.`);
        fetchBinsData();
      } else {
        alert(data.message || 'Failed to update bin status');
      }
    } catch (err) {
      console.error('Error resetting bin:', err);
      alert('Network error while resetting bin.');
    }
  };

  const filteredBins = bins.filter((bin) => {
    if (filter === 'ALL') return true;
    return bin.status === filter;
  });

  const criticalCount = bins.filter((b) => b.status === 'CRITICAL').length;
  const warningCount = bins.filter((b) => b.status === 'WARNING').length;
  const normalCount = bins.filter((b) => b.status === 'NORMAL').length;

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SmartBin Monitor</h1>
            <p className="text-xs text-slate-400">IoT Waste Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user ? user.name : 'Operator'}</p>
            <p className="text-xs text-slate-400">{user ? user.email : 'admin@smartbin.io'}</p>
          </div>
          <button
            onClick={fetchBinsData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 flex items-center gap-2 text-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Sync</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition text-xs flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Bins</p>
              <h3 className="text-2xl font-bold text-white mt-1">{bins.length}</h3>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Zap className="w-3 h-3" /> IoT Online</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl"><Trash2 className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical Overflow (&ge;95%)</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{criticalCount}</h3>
              <p className="text-xs text-rose-400/80 mt-1">Alerts sent to officers</p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Warning Threshold</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{warningCount}</h3>
              <p className="text-xs text-amber-400/80 mt-1">&gt; 75% Capacity</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Normal Capacity</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{normalCount}</h3>
              <p className="text-xs text-emerald-400/80 mt-1">Optimal status</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter:</span>
                {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filter === st ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">Sync: <span className="text-slate-200">{lastUpdated}</span></p>
            </div>

            {loading && <div className="text-center py-12 text-slate-400 text-sm">Loading IoT bin telemetry...</div>}

            {/* Dustbins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBins.map((bin) => {
                const isCritical = bin.fillLevel >= 95;
                const isWarning = bin.fillLevel >= 75 && bin.fillLevel < 95;

                return (
                  <div key={bin.id} className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition shadow-xl ${isCritical ? 'border-rose-500/60 shadow-rose-950/30' : 'border-slate-800'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{bin.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isCritical ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {bin.status}
                        </span>
                      </div>

                      <h2 className="font-semibold text-base text-white">{bin.location}</h2>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" /> {bin.coordinates}
                      </p>
                      
                      {/* Fill Progress Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Fill Level</span>
                          <span className={isCritical ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{bin.fillLevel}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                          <div className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${bin.fillLevel}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Sensor & Officer Details */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Odor: <strong className="text-slate-200">{bin.odorLevel}</strong></span>
                        <span>Battery: <strong className="text-emerald-400">{bin.battery}%</strong></span>
                      </div>

                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500">Assigned Officer</p>
                          <p className="text-slate-200 font-medium">{bin.assignedOfficer?.name || 'Assigned'}</p>
                          <p className="text-[10px] text-slate-400">{bin.assignedOfficer?.phone}</p>
                        </div>
                        <button
                          onClick={() => handleMarkCleaned(bin.id)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Work Done
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Automated Message Dispatch Feed */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <BellRing className="w-5 h-5 text-rose-400 animate-bounce" />
                <h3 className="font-bold text-sm text-white">Automated Officer Alerts</h3>
              </div>

              {alertLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No critical overflows (&ge;95%). All bins operating within normal parameters.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {alertLogs.map((log, index) => (
                    <div key={index} className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between text-[10px] text-rose-400/80 font-mono">
                        <span>DISPATCHED</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}