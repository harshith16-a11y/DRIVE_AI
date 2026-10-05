import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  CalendarCheck,
  Eye,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import VehicleIllustration from '../../components/VehicleIllustration';

export default function AIRecommendationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [prefs, setPrefs] = useState({
    preferred_vehicle_type: 'SUV',
    preferred_transmission: 'Automatic',
    preferred_fuel: 'Diesel',
    preferred_seats: 5,
    budget_per_day: 4500,
  });

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations/me');
      setData(res.data);
      if (res.data.preferences) {
        setPrefs({
          preferred_vehicle_type:
            res.data.preferences.preferred_vehicle_type || 'SUV',
          preferred_transmission:
            res.data.preferences.preferred_transmission || 'Automatic',
          preferred_fuel: res.data.preferences.preferred_fuel || 'Petrol',
          preferred_seats: res.data.preferences.preferred_seats || 5,
          budget_per_day: res.data.preferences.budget_per_day || 4000,
        });
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await api.put('/customers/me', {
        preferred_vehicle_type: prefs.preferred_vehicle_type,
        preferred_transmission: prefs.preferred_transmission,
        preferred_fuel: prefs.preferred_fuel,
        preferred_seats: Number(prefs.preferred_seats),
        budget_per_day: Number(prefs.budget_per_day),
      });
      await fetchRecs();
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Explainable 100-Point AI Scoring Engine • Stored in PostgreSQL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Recommended For You
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every vehicle is dynamically scored against your preferences and
            past rental history using a transparent 100-point rubric: Vehicle
            Type (25), Budget Fit (20), Rental History Affinity (20),
            Transmission (15), Fuel (10), and Seats (10).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center shrink-0">
          {[
            { k: 'Type', v: '25 pts' },
            { k: 'Budget', v: '20 pts' },
            { k: 'History', v: '20 pts' },
            { k: 'Trans.', v: '15 pts' },
            { k: 'Fuel', v: '10 pts' },
            { k: 'Seats', v: '10 pts' },
          ].map((w, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/15"
            >
              <div className="text-[10px] text-slate-300 uppercase">{w.k}</div>
              <div className="text-xs font-extrabold text-indigo-300">{w.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preference Tuner Bar */}
      <form
        onSubmit={handleUpdatePreferences}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Live Preference Tuner (Modify & Watch AI Scores Recalculate)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Persisted in `recommendations` Table
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Preferred Type
            </label>
            <select
              value={prefs.preferred_vehicle_type}
              onChange={(e) =>
                setPrefs({ ...prefs, preferred_vehicle_type: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="SUV">SUV</option>
              <option value="Electric">Electric</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Transmission
            </label>
            <select
              value={prefs.preferred_transmission}
              onChange={(e) =>
                setPrefs({ ...prefs, preferred_transmission: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Fuel Type
            </label>
            <select
              value={prefs.preferred_fuel}
              onChange={(e) =>
                setPrefs({ ...prefs, preferred_fuel: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Seats
            </label>
            <select
              value={prefs.preferred_seats}
              onChange={(e) =>
                setPrefs({ ...prefs, preferred_seats: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value={5}>5 Seats</option>
              <option value={7}>7 Seats</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Daily Budget (₹)
            </label>
            <input
              type="number"
              value={prefs.budget_per_day}
              onChange={(e) =>
                setPrefs({ ...prefs, budget_per_day: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingPrefs}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${savingPrefs ? 'animate-spin' : ''}`}
            />
            <span>{savingPrefs ? 'Scoring...' : 'Re-Score Fleet'}</span>
          </button>
        </div>
      </form>

      {/* Recommendations List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-52 rounded-3xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {(data?.recommendations || []).map((rec, idx) => {
            const v = rec.vehicle;
            const score = Math.round(rec.score);
            return (
              <div
                key={rec.vehicle_id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Vehicle Image */}
                <div className="lg:col-span-4 relative">
                  <VehicleIllustration
                    vehicle={v}
                    className="h-full min-h-[210px] w-full"
                  />
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow">
                      #{idx + 1} Best Match
                    </span>
                  </div>
                </div>

                {/* Explainable AI Breakdown */}
                <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                            {v.brand} • {v.vehicle_type}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              v.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                          {v.brand} {v.model} ({v.year})
                        </h3>
                        <p className="text-xs text-slate-500">
                          {v.transmission} • {v.fuel_type} • {v.seats} Seats •{' '}
                          {v.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Daily Rate</div>
                          <div className="text-xl font-extrabold text-slate-900">
                            ₹{Number(v.daily_rate).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex flex-col items-center justify-center text-indigo-700">
                          <span className="text-xl font-extrabold">
                            {score}%
                          </span>
                          <span className="text-[10px] font-bold uppercase">
                            AI Score
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>

                    {/* Why Recommended Explanation */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-indigo-900 mb-0.5">
                          Why Recommended by AI:
                        </span>
                        <p className="leading-relaxed">{rec.reason}</p>
                      </div>
                    </div>

                    {/* Matching Preference Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(rec.matching_factors || []).map((factor, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </Link>
                    <Link
                      to={`/vehicles/${v.id}?book=true`}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Book This Vehicle</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
