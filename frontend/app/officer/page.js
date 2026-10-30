'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Lock, ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';

export default function OfficerPortal() {
  const [accessCode, setAccessCode] = useState('');
  const [officer, setOfficer] = useState(null);
  const [assignedBins, setAssignedBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastPointChange, setLastPointChange] = useState(null);

  const fetchOfficerTasks = async (code) => {
    const res = await fetch('http://localhost:5000/api/officer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode: code })
    });

    const data = await res.json();
    if (res.ok) {
      setOfficer(data.officer);
      // Filter strictly to show ONLY active critical task bins requiring cleaning
      const activeTasks = data.assignedBins.filter(bin => bin.fillLevel >= 95 || bin.status === 'CRITICAL');
      setAssignedBins(activeTasks);
      return true;
    } else {
      alert(data.message || 'Invalid Officer Access Code');
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchOfficerTasks(accessCode);
    } catch (err) {
      alert('Network error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWork = async (binId) => {
    try {
      const res = await fetch('http://localhost:5000/api/officer/complete-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binId })
      });

      const data = await res.json();
      if (res.ok) {
        // Show point notification banner on profile
        const points = data.pointsAwarded;
        setLastPointChange(points);
        setTimeout(() => setLastPointChange(null), 4000);

        alert(`✅ Task Complete! ${data.message}`);
        
        // Refresh officer profile and task list — cleaned bin is automatically removed!
        await fetchOfficerTasks(accessCode);
      } else {
        alert(data.message || 'Error completing task.');
      }
    } catch (err) {
      alert('Error connecting to backend server.');
    }
  };

  if (!officer) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl mb-4 mx-auto border border-emerald-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-center">Officer Task Login</h1>
          <p className="text-xs text-slate-400 text-center mb-6 mt-1">Enter your assigned numeric security code</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Access Security Code</label>
              <input
                type="password"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="e.g. 1001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono tracking-widest text-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 font-semibold py-2.5 rounded-xl text-slate-950 transition text-sm shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Authenticating...' : 'Access Field Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-2xl mx-auto space-y-6 font-sans">
      {/* Officer Profile Header & Points Display */}
      <div className="bg-slate-900 p-5 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">{officer.name}</h1>
              <p className="text-xs text-slate-400">Field Officer ({officer.phone})</p>
            </div>
          </div>
          
          <button
            onClick={() => { setOfficer(null); setAccessCode(''); }}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Logout
          </button>
        </div>

        {/* Live Points Counter */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Accumulated Performance Score</p>
            <div className="flex items-center gap-2 mt-1">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold text-white">{officer.points || 0}</span>
              <span className="text-xs text-amber-400 font-semibold">PTS</span>
            </div>
          </div>

          {/* Point Change Popover Alert */}
          {lastPointChange !== null && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border animate-bounce ${
              lastPointChange > 0 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {lastPointChange > 0 ? `+${lastPointChange} Points!` : `${lastPointChange} Penalty!`}
            </div>
          )}
        </div>
      </div>

      {/* Speed Bonus Rules */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1">
        <p className="font-semibold text-emerald-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Speed Bonus System:</p>
        <p>• Clean critical bin within <strong>5 minutes</strong> = <strong className="text-emerald-400">+10 Points</strong></p>
        <p>• Clean critical bin after <strong>5 minutes</strong> = <strong className="text-rose-400">-15 Points</strong> penalty</p>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
        <Zap className="w-4 h-4 text-rose-400" /> Assigned Pending Clean Tasks
      </h2>

      {/* Assigned Dustbins List */}
      <div className="space-y-4">
        {assignedBins.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            🎉 All assigned bins are clean! No critical task items requiring attention.
          </div>
        ) : (
          assignedBins.map((bin) => (
            <div key={bin.binId} className="bg-slate-900 border border-rose-500/80 bg-rose-950/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300">{bin.binId}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
                  {bin.fillLevel}% CRITICAL OVERFLOW
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">{bin.location}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Last Emptied: {bin.lastEmptied}</p>
              </div>

              <button
                onClick={() => handleCompleteWork(bin.binId)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Cleaned & Update Profile Points
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}