import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Receipt,
  Calendar,
  Car,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAMAGE_FEES = {
  Good: 0,
  'Minor Damage': 2500,
  'Major Damage': 8500,
};

export default function CustomerRentalsAndReturn() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('returnBookingId');
  const { refreshNotifications } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [returnDate, setReturnDate] = useState('');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [finalBillReceipt, setFinalBillReceipt] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      const list = res.data || [];
      setBookings(list);

      const returnable = list.filter(
        (b) => b.status === 'ACTIVE' || b.status === 'CONFIRMED'
      );

      if (preselectedId) {
        const match = returnable.find((b) => String(b.id) === String(preselectedId));
        if (match) {
          setSelectedBooking(match);
          setReturnDate(match.end_date);
        }
      } else if (returnable.length > 0 && !selectedBooking) {
        setSelectedBooking(returnable[0]);
        setReturnDate(returnable[0].end_date);
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [preselectedId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSelectForReturn = (b) => {
    setSelectedBooking(b);
    setReturnDate(b.end_date);
    setCondition('Good');
    setNotes('');
    setErrorMsg('');
    setFinalBillReceipt(null);
  };

  const handleCancelBooking = async (bookingId) => {
    setErrorMsg('');
    try {
      await api.delete(`/bookings/${bookingId}`);
      await fetchBookings();
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to cancel booking.');
    }
  };

  // Live Return Bill Preview Calculation
  const billPreview = (() => {
    if (!selectedBooking || !returnDate) {
      return { lateDays: 0, lateFee: 0, damageFee: 0, finalAmount: 0 };
    }
    const endMs = new Date(selectedBooking.end_date).getTime();
    const retMs = new Date(returnDate).getTime();
    const diffDays = Math.round((retMs - endMs) / (1000 * 3600 * 24));
    const lateDays = Math.max(0, diffDays);
    const lateFee = Math.round(
      lateDays * Number(selectedBooking.daily_rate) * 1.2 * 100
    ) / 100;
    const damageFee = DAMAGE_FEES[condition] || 0;
    const finalAmount =
      Number(selectedBooking.subtotal) + lateFee + damageFee;
    return { lateDays, lateFee, damageFee, finalAmount };
  })();

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/returns', {
        booking_id: selectedBooking.id,
        return_date: returnDate,
        condition,
        notes,
      });
      setFinalBillReceipt(res.data);
      setSelectedBooking(null);
      await fetchBookings();
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to process vehicle return.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeOrConfirmed = bookings.filter(
    (b) =>
      b.status === 'ACTIVE' ||
      b.status === 'CONFIRMED' ||
      b.status === 'PENDING'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Vehicle Return & Billing Module
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Active Rentals & Vehicle Return
          </h1>
        </div>
        <Link
          to="/customer/history"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
        >
          View Completed Rental History
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Final Bill Receipt Banner after Return */}
      {finalBillReceipt && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Return Completed • Vehicle Status Restored to AVAILABLE
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Official Final Rental Bill —{' '}
                  {finalBillReceipt.return_record?.booking_reference}
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              BOOKING COMPLETED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Base Rental Subtotal</span>
              <div className="text-lg font-extrabold text-slate-900 mt-1">
                ₹
                {Number(
                  finalBillReceipt.return_record?.base_subtotal || 0
                ).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-amber-800">
                Late Fee ({finalBillReceipt.return_record?.late_days} late days)
              </span>
              <div className="text-lg font-extrabold text-amber-900 mt-1">
                + ₹
                {Number(
                  finalBillReceipt.return_record?.late_fee || 0
                ).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-rose-800">
                Damage Fee ({finalBillReceipt.return_record?.condition})
              </span>
              <div className="text-lg font-extrabold text-rose-900 mt-1">
                + ₹
                {Number(
                  finalBillReceipt.return_record?.damage_fee || 0
                ).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow">
              <span className="text-indigo-200">Final Bill Total</span>
              <div className="text-xl font-extrabold mt-1">
                ₹
                {Number(
                  finalBillReceipt.return_record?.final_amount || 0
                ).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Active / Confirmed Bookings List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Select Active or Confirmed Rental ({activeOrConfirmed.length})
          </h2>

          {loading ? (
            <div className="h-60 rounded-3xl bg-slate-200 animate-pulse" />
          ) : activeOrConfirmed.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
              <Car className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No active rentals waiting for return
              </h3>
              <p className="text-xs text-slate-500">
                Book a vehicle from the fleet to test the active rental and
                return workflow.
              </p>
              <Link
                to="/vehicles"
                className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Book a Vehicle Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrConfirmed.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {b.booking_reference}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === 'ACTIVE'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.payment_status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {b.payment_status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {b.vehicle?.brand} {b.vehicle?.model} (
                          {b.vehicle?.vehicle_number})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Dates: {b.start_date} to {b.end_date} ({b.total_days}{' '}
                          days) • Subtotal: ₹
                          {Number(b.subtotal).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.payment_status !== 'PAID' && (
                          <Link
                            to={`/customer/payment/${b.id}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Now</span>
                          </Link>
                        )}
                        {(b.status === 'ACTIVE' ||
                          b.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => handleSelectForReturn(b)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Select for Return</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Vehicle Return & Final Bill Calculator Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Return Inspection & Final Billing
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Process Vehicle Return
              </h2>
            </div>

            {!selectedBooking ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Select an active or confirmed booking on the left to inspect
                condition and generate the final return bill.
              </div>
            ) : (
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking ID / Ref</span>
                    <span className="font-mono font-bold text-indigo-600">
                      #{selectedBooking.id} ({selectedBooking.booking_reference})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-bold text-slate-900">
                      {selectedBooking.customer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-bold text-slate-900">
                      {selectedBooking.vehicle?.brand}{' '}
                      {selectedBooking.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Dates</span>
                    <span className="font-semibold text-slate-800">
                      {selectedBooking.start_date} → {selectedBooking.end_date}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Return Date (Set after {selectedBooking.end_date} to test Late Fee)
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Return Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                  >
                    <option value="Good">Good (₹0 Damage Fee)</option>
                    <option value="Minor Damage">
                      Minor Damage (+₹2,500 Damage Fee)
                    </option>
                    <option value="Major Damage">
                      Major Damage (+₹8,500 Damage Fee)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inspection Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional return inspection notes..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Live Final Bill Calculation Breakdown */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs">
                  <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                    Calculated Final Bill Preview
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Rental Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(selectedBooking.subtotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Late Fee ({billPreview.lateDays} late days @ 1.2× daily rate)
                    </span>
                    <span className="font-bold text-amber-700">
                      + ₹{billPreview.lateFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Damage Fee ({condition})</span>
                    <span className="font-bold text-rose-700">
                      + ₹{billPreview.damageFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm font-extrabold text-indigo-950">
                    <span>Final Total Amount</span>
                    <span className="text-indigo-700">
                      ₹{billPreview.finalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Completing Return & Archiving History...'
                      : 'Complete Return & Generate Final Bill'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
