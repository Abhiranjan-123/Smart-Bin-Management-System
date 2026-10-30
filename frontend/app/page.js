'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const API_URL = 'http://localhost:5000/api';
    const endpoint = isRegister ? `${API_URL}/register` : `${API_URL}/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister
            ? formData
            : { email: formData.email, password: formData.password }
        )
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error occurred');
        return;
      }

      if (isRegister) {
        alert('Complete registration successfully! You can now sign in.');
        setIsRegister(false);
        setFormData({ name: '', phone: '', email: formData.email, password: '', confirmPassword: '' });
      } else {
        // Save user profile to localStorage and redirect to dashboard
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error("Connection error:", err);
      alert('Unable to connect to backend server. Make sure node server.js is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h1>

        {/* Checkbox Switcher */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6">
          <label htmlFor="modeToggle" className="text-sm text-slate-300 cursor-pointer select-none">
            {isRegister ? 'Already have an account?' : 'Need to register first?'}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="modeToggle"
              type="checkbox"
              checked={isRegister}
              onChange={(e) => setIsRegister(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-emerald-400">
              {isRegister ? 'REGISTER' : 'SIGN IN'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email ID</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold py-2.5 rounded-lg transition-all text-sm mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Submit & Register' : 'Sign In'}
          </button>
        </form>

        {/* Link to Officer Portal */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link
            href="/officer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            <ShieldCheck className="w-4 h-4" /> Field Officer? Access Officer Code Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}