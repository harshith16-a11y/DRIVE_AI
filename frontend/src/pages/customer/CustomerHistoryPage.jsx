import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  X,
  Receipt,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/history', {
        params: {
          search: search.trim() || undefined,
          booking_status: bookingStatus !== 'ALL' ? bookingStatus : undefined,
          payment_status: paymentStatus !== 'ALL' ? paymentStatus : undefined,
          vehicle_type: vehicleType !== 'ALL' ? vehicleType : undefined,
          sort_by: sortBy,
        },
      });
      setRecords(res.data || []);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [search, bookingStatus, paymentStatus, vehicleType, sortBy]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          PostgreSQL Rental History Log
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {user?.role === 'ADMIN'
            ? 'Complete System Rental History'
            : 'My Rental & Booking History'}
        </h1>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Search Booking ID, Vehicle, Customer
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="VR-2026-1001, Creta, Rahul..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Booking Status
          </label>
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Vehicle Type
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="SUV">SUV</option>
            <option value="Electric">Electric</option>
            <option value="Sedan">Sedan</option>
            <option value="Hatchback">Hatchback</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading rental history from PostgreSQL...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No rental history records match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Booking ID</th>
                  {user?.role === 'ADMIN' && (
                    <th className="py-3.5 px-4">Customer</th>
                  )}
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Rental Dates</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Booking Status</th>
                  <th className="py-3.5 px-4">Return Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.booking_id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      #{r.booking_id} ({r.booking_reference})
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {r.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.customer_email}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {r.vehicle?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.vehicle?.vehicle_number} • {r.vehicle?.vehicle_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {r.rented_from} → {r.rented_to}
                      <div className="text-[11px] text-slate-400">
                        {r.total_days} day(s)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ₹{Number(r.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.payment_status === 'REFUNDED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.booking_status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.booking_status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-800'
                            : r.booking_status === 'CONFIRMED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : r.booking_status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.booking_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {r.return_status}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice / Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Rental Statement
                  </h3>
                  <p className="text-xs font-mono text-indigo-600 font-bold">
                    {selectedItem.booking_reference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-bold text-slate-900">
                  {selectedItem.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-bold text-slate-900">
                  {selectedItem.vehicle?.name} (
                  {selectedItem.vehicle?.vehicle_number})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Window</span>
                <span className="font-semibold text-slate-900">
                  {selectedItem.rented_from} → {selectedItem.rented_to} (
                  {selectedItem.total_days} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method & Ref</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedItem.payment_method} •{' '}
                  {selectedItem.transaction_reference}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Base Booking Subtotal</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(selectedItem.base_subtotal).toLocaleString('en-IN')}
                </span>
              </div>

              {selectedItem.return_details && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Return Condition ({selectedItem.return_details.return_date})
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedItem.return_details.condition}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Late Fee ({selectedItem.return_details.late_days} late days)
                    </span>
                    <span className="font-bold text-amber-700">
                      ₹
                      {Number(
                        selectedItem.return_details.late_fee
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Damage Fee</span>
                    <span className="font-bold text-rose-700">
                      ₹
                      {Number(
                        selectedItem.return_details.damage_fee
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedItem.return_details.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                      Notes: {selectedItem.return_details.notes}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Final Billed Amount</span>
                <span className="text-indigo-600">
                  ₹{Number(selectedItem.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
