import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  IndianRupee,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_collected: 0,
    pending_amount: 0,
    failed_amount: 0,
    refunded_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          method: methodFilter !== 'ALL' ? methodFilter : undefined,
        },
      });
      setPayments(res.data.payments || []);
      setSummary(res.data.summary || {});
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Financial Transaction Ledger
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Payment Management & Revenue Summary
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">
            Total Collected (PAID)
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{Number(summary.total_collected || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">
            Pending Payments
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            ₹{Number(summary.pending_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">
            Failed Payments
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            ₹{Number(summary.failed_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">
            Refunded Amount
          </div>
          <div className="text-2xl font-extrabold text-slate-700 mt-1">
            ₹{Number(summary.refunded_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction ref, booking, customer..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        >
          <option value="ALL">All Payment Methods</option>
          <option value="UPI">UPI</option>
          <option value="CARD">CARD</option>
          <option value="DEMO">DEMO</option>
          <option value="CASH">CASH</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Transaction Reference</th>
                <th className="py-3.5 px-4">Booking</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {p.transaction_reference}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {p.booking_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {p.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {p.customer_email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {p.vehicle_name} ({p.vehicle_number})
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">
                    {p.payment_method}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.payment_status === 'REFUNDED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {p.paid_at ? new Date(p.paid_at).toLocaleString() : 'N/A'}
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
