import React, { useEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminReturnsPage() {
  const [returnsList, setReturnsList] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  // Admin quick return form
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [returnDate, setReturnDate] = useState('2026-09-30');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [retRes, bookRes] = await Promise.all([
        api.get('/returns', {
          params: {
            search: search.trim() || undefined,
            condition: conditionFilter !== 'ALL' ? conditionFilter : undefined,
          },
        }),
        api.get('/bookings'),
      ]);
      setReturnsList(retRes.data || []);
      const openOnes = (bookRes.data || []).filter(
        (b) => b.status === 'ACTIVE' || b.status === 'CONFIRMED'
      );
      setActiveBookings(openOnes);
      if (openOnes.length > 0 && !selectedBookingId) {
        setSelectedBookingId(String(openOnes[0].id));
        setReturnDate(openOnes[0].end_date);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [search, conditionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdminReturn = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    setMsg('');
    setErr('');
    try {
      const res = await api.post('/returns', {
        booking_id: Number(selectedBookingId),
        return_date: returnDate,
        condition,
        notes,
      });
      setMsg(
        `Return processed for Booking ${res.data.return_record.booking_reference}. Final Bill: ₹${Number(
          res.data.return_record.final_amount
        ).toLocaleString('en-IN')}`
      );
      setSelectedBookingId('');
      await fetchData();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to process return.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Return Inspection & Penalty Audit
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Vehicle Return Records ({returnsList.length})
        </h1>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Admin Active Rental Return Form */}
      {activeBookings.length > 0 && (
        <form
          onSubmit={handleAdminReturn}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Process Return for Active / Confirmed Rental
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-600 mb-1">
                Select Active Booking
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  const found = activeBookings.find(
                    (b) => String(b.id) === e.target.value
                  );
                  if (found) setReturnDate(found.end_date);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                {activeBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} ({b.booking_reference}) — {b.customer_name} —{' '}
                    {b.vehicle?.brand} {b.vehicle?.model} (Ends {b.end_date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                Return Date
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="Good">Good (₹0)</option>
                <option value="Minor Damage">Minor Damage (+₹2,500)</option>
                <option value="Major Damage">Major Damage (+₹8,500)</option>
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Complete Return
            </button>
          </div>
        </form>
      )}

      {/* Search & Condition Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ref, customer, or vehicle..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          />
        </div>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        >
          <option value="ALL">All Conditions</option>
          <option value="Good">Good</option>
          <option value="Minor Damage">Minor Damage</option>
          <option value="Major Damage">Major Damage</option>
        </select>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Scheduled End</th>
                <th className="py-3.5 px-4">Return Date</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Late Fee</th>
                <th className="py-3.5 px-4">Damage Fee</th>
                <th className="py-3.5 px-4">Final Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnsList.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {r.booking_reference}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {r.customer_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {r.vehicle_name} ({r.vehicle_number})
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{r.end_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {r.return_date}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.condition === 'Good'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.condition}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-700">
                    ₹{Number(r.late_fee).toLocaleString('en-IN')} (
                    {r.late_days}d)
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-700">
                    ₹{Number(r.damage_fee).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    ₹{Number(r.final_amount).toLocaleString('en-IN')}
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
