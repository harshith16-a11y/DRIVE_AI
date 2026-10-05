import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  Sparkles,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';

export default function AdminDemandAnalysisPage() {
  const [demand, setDemand] = useState(null);
  const [recStats, setRecStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/demand/analysis'),
      api.get('/recommendations/admin/stats'),
    ])
      .then(([demRes, recRes]) => {
        setDemand(demRes.data);
        setRecStats(recRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !demand) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
            <BrainCircuit className="w-4 h-4" />
            <span>{demand.label}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Demand-Oriented AI Analysis & Recommendation Statistics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Methodology: <span className="font-bold text-white">{demand.methodology}</span>.
            Forecasts future fleet demand directly from operational PostgreSQL
            booking, rental history, and customer preference records.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center shrink-0">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <div className="text-[11px] text-slate-300">Historical Rentals</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {demand.total_historical_rentals}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <div className="text-[11px] text-slate-300">Fleet Utilization</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {demand.overall_utilization_percentage}%
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
            <div className="text-[11px] text-slate-300">Avg AI Match Score</div>
            <div className="text-2xl font-extrabold text-indigo-300 mt-1">
              {recStats?.average_score || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Primary Demand-Oriented Prediction Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              {demand.label}
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              Vehicle Demand Forecast by Category
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Demand-oriented prediction
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3.5 px-5">Vehicle Type</th>
                <th className="py-3.5 px-5">Fleet Size</th>
                <th className="py-3.5 px-5">Historical Rentals</th>
                <th className="py-3.5 px-5">Total Days Rented</th>
                <th className="py-3.5 px-5">Utilization %</th>
                <th className="py-3.5 px-5">Current Demand</th>
                <th className="py-3.5 px-5">Predicted Demand</th>
                <th className="py-3.5 px-5">Projected Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(demand.demand_by_type || []).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 px-5 font-extrabold text-slate-900">
                    {row.vehicle_type}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    {row.fleet_count} vehicles
                  </td>
                  <td className="py-3.5 px-5 font-bold text-indigo-600 text-sm">
                    {row.historical_rentals}
                  </td>
                  <td className="py-3.5 px-5 text-slate-700">
                    {row.total_days_rented} days
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    {row.utilization_percentage}%
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        row.current_demand === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : row.current_demand === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.current_demand}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-extrabold text-rose-600 text-sm">
                    {row.predicted_demand}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-700">
                    +{row.growth_percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts: Demand by Type & Popular Rental Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            Historical Rentals vs. Demand-Oriented Prediction
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demand.demand_by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vehicle_type" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="historical_rentals"
                  name="Historical Rentals"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="predicted_demand"
                  name="Predicted Demand"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            Popular Rental Days of the Week
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demand.popular_days_of_week}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="bookings"
                  name="Bookings Started"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Recommendation Scores & Reasons Stored in PostgreSQL */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              PostgreSQL `recommendations` Table Audit
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              AI Recommendation Scores & Explainable Reasons (
              {recStats?.total_stored_recommendations || 0} Records)
            </h2>
          </div>
          <span className="text-xs font-bold text-indigo-600">
            High-Confidence Matches (≥80%): {recStats?.high_confidence_matches || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Recommended Vehicle</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Explainable Reason</th>
                <th className="py-3 px-4">Matching Factors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recStats?.records || []).slice(0, 15).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {r.customer_name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">
                      {r.vehicle_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.vehicle_type} • ₹
                      {Number(r.daily_rate).toLocaleString('en-IN')}/d
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full font-extrabold bg-indigo-100 text-indigo-800">
                      {Math.round(r.score)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-md">
                    {r.reason}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(r.matching_factors || []).map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
