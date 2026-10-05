import React, { useEffect, useState } from 'react';
import { UserCircle, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfilePage() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_vehicle_type: 'SUV',
    preferred_transmission: 'Automatic',
    preferred_fuel: 'Diesel',
    preferred_seats: 5,
    budget_per_day: 4500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api
      .get('/customers/me')
      .then((res) => {
        const d = res.data;
        setForm({
          name: d.name || '',
          email: d.email || '',
          phone: d.phone || '',
          preferred_vehicle_type: d.preferred_vehicle_type || 'SUV',
          preferred_transmission: d.preferred_transmission || 'Automatic',
          preferred_fuel: d.preferred_fuel || 'Petrol',
          preferred_seats: d.preferred_seats || 5,
          budget_per_day: d.budget_per_day || 4000,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');
    try {
      await api.put('/customers/me', {
        name: form.name,
        phone: form.phone,
        preferred_vehicle_type: form.preferred_vehicle_type,
        preferred_transmission: form.preferred_transmission,
        preferred_fuel: form.preferred_fuel,
        preferred_seats: Number(form.preferred_seats),
        budget_per_day: Number(form.budget_per_day),
      });
      await refreshUser();
      setSavedMsg(
        'Profile and AI vehicle preferences saved! Recommendations have been refreshed in PostgreSQL.'
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to update customer profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-72 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              My Profile & AI Preferences
            </h1>
            <p className="text-xs text-slate-500">
              Updates persist in `users` and `customers` tables and trigger AI
              recommendation re-scoring
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Email Address (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={form.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold">
                AI Vehicle Recommendation Preferences
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Preferred Vehicle Type
                </label>
                <select
                  value={form.preferred_vehicle_type}
                  onChange={(e) =>
                    setForm({ ...form, preferred_vehicle_type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="SUV">SUV</option>
                  <option value="Electric">Electric</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Preferred Transmission
                </label>
                <select
                  value={form.preferred_transmission}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferred_transmission: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Preferred Fuel
                </label>
                <select
                  value={form.preferred_fuel}
                  onChange={(e) =>
                    setForm({ ...form, preferred_fuel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Preferred Seats
                </label>
                <select
                  value={form.preferred_seats}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferred_seats: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value={5}>5 Seats</option>
                  <option value={7}>7 Seats</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Daily Budget (₹ / Day)
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  value={form.budget_per_day}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      budget_per_day: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            {saving ? 'Saving Changes...' : 'Save Profile & Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}
