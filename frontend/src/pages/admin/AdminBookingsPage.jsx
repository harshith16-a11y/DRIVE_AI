import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  XCircle,
  CheckCircle2,
  Play,
  X,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setBookings(res.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId, newStatus) => {
    setMsg('');
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus });
      setMsg(`Booking #${bookingId} status updated to ${newStatus}.`);
      await fetchBookings();
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Reservation Operations
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Booking Management ({bookings.length})
        </h1>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ID, reference, customer, or vehicle..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          title="Filter From Date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          title="Filter To Date"
        />
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    #{b.id} ({b.booking_reference})
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {b.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.customer_email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.vehicle?.vehicle_number}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {b.start_date} → {b.end_date} ({b.total_days}d)
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    ₹{Number(b.subtotal).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.payment_status === 'REFUNDED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'CONFIRMED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    {b.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b.id, 'ACTIVE')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold"
                        title="Mark Rental as Active"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </button>
                    )}
                    {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Booking #{selectedBooking.id}
                </h3>
                <p className="font-mono font-bold text-indigo-600">
                  {selectedBooking.booking_reference}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.customer_name} ({selectedBooking.customer_email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.vehicle?.brand}{' '}
                  {selectedBooking.vehicle?.model} (
                  {selectedBooking.vehicle?.vehicle_number})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dates & Days</span>
                <span className="font-semibold text-slate-800">
                  {selectedBooking.start_date} → {selectedBooking.end_date} (
                  {selectedBooking.total_days} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-extrabold text-slate-900">
                  ₹{Number(selectedBooking.subtotal).toLocaleString('en-IN')}
                </span>
              </div>
              {selectedBooking.payment && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedBooking.payment.transaction_reference} (
                    {selectedBooking.payment.payment_method})
                  </span>
                </div>
              )}
              {selectedBooking.return_record && (
                <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-800">
                    Return Condition: {selectedBooking.return_record.condition}
                  </div>
                  <div>
                    Late Fee: ₹{selectedBooking.return_record.late_fee} • Damage
                    Fee: ₹{selectedBooking.return_record.damage_fee} • Final
                    Amount: ₹{selectedBooking.return_record.final_amount}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
