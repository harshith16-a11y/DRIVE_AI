import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Smartphone,
  Banknote,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Receipt,
  Printer,
  ArrowRight,
  Lock,
  Building2,
  Wallet,
  RefreshCw,
  Car,
  Calendar,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PAYING_MODES = [
  {
    id: 'UPI',
    title: 'UPI Instant Pay',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM & QR Scan',
    badge: 'Zero Convenience Fee',
    icon: Smartphone,
    color: 'emerald',
  },
  {
    id: 'CARD',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, RuPay & Corporate Cards',
    badge: '256-Bit Encrypted',
    icon: CreditCard,
    color: 'indigo',
  },
  {
    id: 'CASH',
    title: 'Cash / Pay at Hub',
    subtitle: 'Pay in cash or POS terminal at vehicle pickup hub',
    badge: 'Instant Voucher',
    icon: Banknote,
    color: 'amber',
  },
  {
    id: 'DEMO',
    title: '1-Click Prototype Demo',
    subtitle: 'Instant college review checkout & ACID rollback tester',
    badge: 'DBMS Review Mode',
    icon: Sparkles,
    color: 'violet',
  },
];

export default function CustomerPaymentsPage() {
  const { user, refreshNotifications } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');

  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_collected: 0,
    pending_amount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Selected booking to pay
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Interactive Mode-Specific Inputs
  const [upiSubMode, setUpiSubMode] = useState('QR'); // 'QR' | 'ID'
  const [upiApp, setUpiApp] = useState('GPay');
  const [upiId, setUpiId] = useState('aarav.sharma@okaxis');
  const [upiVerified, setUpiVerified] = useState(true);

  const [cardDetails, setCardDetails] = useState({
    number: '4532 •••• •••• 8891',
    name: user?.name || 'AARAV SHARMA',
    expiry: '08/29',
    cvv: '842',
    network: 'VISA',
  });

  const [cashNotes, setCashNotes] = useState('Will pay at pickup desk 15 mins prior');

  // Filter state for payment history table
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Processing & Receipt Modal
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [invoiceModalPayment, setInvoiceModalPayment] = useState(null);

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, payRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/payments', {
          params: {
            method: methodFilter !== 'ALL' ? methodFilter : undefined,
            search: searchQuery || undefined,
          },
        }),
      ]);

      const bookingList = bookRes.data || [];
      setBookings(bookingList);
      setPayments(payRes.data.payments || []);
      setSummary(
        payRes.data.summary || {
          total_transactions: 0,
          total_collected: 0,
          pending_amount: 0,
        }
      );

      // Select pending/unpaid booking by default
      const unpaidList = bookingList.filter(
        (b) => b.payment_status !== 'PAID' && b.status !== 'CANCELLED'
      );
      if (preselectedBookingId) {
        setSelectedBookingId(String(preselectedBookingId));
      } else if (unpaidList.length > 0 && !selectedBookingId) {
        setSelectedBookingId(String(unpaidList[0].id));
      }
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [methodFilter, searchQuery, preselectedBookingId, selectedBookingId]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const unpaidBookings = bookings.filter(
    (b) => b.payment_status !== 'PAID' && b.status !== 'CANCELLED'
  );

  const selectedBooking = bookings.find(
    (b) => String(b.id) === String(selectedBookingId)
  );

  const handleCreateQuickPendingBooking = async () => {
    setProcessing(true);
    setErrorMsg('');
    try {
      const vehRes = await api.get('/vehicles', {
        params: { status: 'AVAILABLE' },
      });
      const availableVehicles = vehRes.data || [];
      const targetVehicle = availableVehicles[0];
      if (!targetVehicle) {
        setErrorMsg('No available vehicles found to create a test booking.');
        setProcessing(false);
        return;
      }

      // Pick a safe 2-day window in future
      const randomOffset = Math.floor(Math.random() * 40) + 20;
      const start = new Date();
      start.setDate(start.getDate() + randomOffset);
      const end = new Date(start);
      end.setDate(start.getDate() + 2);

      const fmt = (d) => d.toISOString().split('T')[0];

      const res = await api.post('/bookings', {
        vehicle_id: targetVehicle.id,
        start_date: fmt(start),
        end_date: fmt(end),
      });

      await fetchPaymentData();
      setSelectedBookingId(String(res.data.id));
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          'Could not generate demo pending booking.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleExecutePayment = async (e) => {
    e.preventDefault();
    if (!selectedBooking) {
      setErrorMsg('Please select a pending booking to pay.');
      return;
    }

    if (paymentMethod === 'UPI' && upiSubMode === 'ID' && !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g., username@okaxis).');
      return;
    }

    setProcessing(true);
    setErrorMsg('');
    setSuccessReceipt(null);

    try {
      const res = await api.post('/payments', {
        booking_id: Number(selectedBooking.id),
        payment_method: paymentMethod,
        simulate_failure: simulateFailure,
      });
      setSuccessReceipt(res.data);
      await fetchPaymentData();
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          'Payment failed and transaction was rolled back.'
      );
      await fetchPaymentData();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Multi-Mode Payment Gateway • ACID PostgreSQL Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Payments, Paying Modes & Digital Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Choose your preferred paying mode —{' '}
            <span className="text-white font-semibold">
              UPI (QR / GPay / PhonePe), Credit & Debit Card, Cash at Hub, or
              1-Click Prototype Demo
            </span>{' '}
            — with real-time atomic PostgreSQL transaction commit & rollback verification.
          </p>
        </div>

        {/* Summary KPIs in Header */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
              Total Paid
            </span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              ₹{Number(summary.total_collected || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
              Unpaid Bookings
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {unpaidBookings.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
              Receipts
            </span>
            <div className="text-xl font-extrabold text-white mt-1">
              {summary.total_transactions || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Paying Mode Terminal) & Right (Interactive Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Columns: Step 1 (Select Booking) + Step 2 (Choose Paying Mode) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Booking Selector Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Step 1 • Select Reservation
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  Booking to Pay
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCreateQuickPendingBooking}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                title="Instantly create a PENDING booking to test any Paying Mode"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ New Demo Pending Booking</span>
              </button>
            </div>

            {unpaidBookings.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    All your current bookings are PAID!
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click &ldquo;+ New Demo Pending Booking&rdquo; above or book a
                    vehicle from the fleet to test the live Paying Modes.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateQuickPendingBooking}
                    disabled={processing}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Generate Pending Booking Now
                  </button>
                  <Link
                    to="/vehicles"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Browse Fleet
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {unpaidBookings.map((b) => {
                  const isSelected = String(b.id) === String(selectedBookingId);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBookingId(String(b.id));
                        setSuccessReceipt(null);
                        setErrorMsg('');
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">
                            {b.booking_reference}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {b.payment_status}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-1">
                          {b.vehicle?.brand} {b.vehicle?.model}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.start_date} → {b.end_date} ({b.total_days} days)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-extrabold text-slate-900">
                          ₹{Number(b.subtotal).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {isSelected ? 'Selected ✓' : 'Click to Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paying Mode Selector Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Step 2 • Choose Paying Mode
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Select Payment Mode
              </h2>
            </div>

            <div className="space-y-2.5">
              {PAYING_MODES.map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setErrorMsg('');
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {m.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {m.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Interactive Paying Mode Terminal & Checkout */}
        <div className="lg:col-span-7 space-y-6">
          {successReceipt ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      ACID Transaction Committed • PostgreSQL Verified
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Payment Successful via {successReceipt.payment?.payment_method}!
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceModalPayment(successReceipt.payment)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>View / Print Tax Invoice</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Transaction Reference</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {successReceipt.payment?.transaction_reference}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Booking Reference</span>
                  <div className="font-mono font-bold text-indigo-600 text-sm mt-0.5">
                    {successReceipt.booking?.booking_reference}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Vehicle Reserved</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {successReceipt.booking?.vehicle?.brand}{' '}
                    {successReceipt.booking?.vehicle?.model} (
                    {successReceipt.booking?.vehicle?.vehicle_number})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Amount Paid & Mode</span>
                  <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                    ₹
                    {Number(successReceipt.payment?.amount || 0).toLocaleString(
                      'en-IN'
                    )}{' '}
                    • {successReceipt.payment?.payment_method}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/customer/rentals"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  <span>Go to Active Rentals & Return</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSuccessReceipt(null)}
                  className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Make Another Payment
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleExecutePayment}
              className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Step 3 • Interactive Paying Mode Terminal
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {paymentMethod === 'UPI' && 'UPI Instant Checkout (QR & VPA)'}
                    {paymentMethod === 'CARD' && 'Credit / Debit Card Checkout'}
                    {paymentMethod === 'CASH' && 'Cash at Pickup Hub Authorization'}
                    {paymentMethod === 'DEMO' && '1-Click College Prototype Demo Pay'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">
                    Payable Amount
                  </span>
                  <span className="text-2xl font-extrabold text-indigo-600">
                    ₹
                    {selectedBooking
                      ? Number(selectedBooking.subtotal).toLocaleString('en-IN')
                      : '0'}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Payment Rejected / Rolled Back</div>
                    <div>{errorMsg}</div>
                  </div>
                </div>
              )}

              {/* MODE 1: UPI INTERACTIVE TERMINAL */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-5">
                  {/* UPI App Pills */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Select Preferred UPI App
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                            upiApp === app
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle between Scan QR vs Enter UPI ID */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('QR')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        upiSubMode === 'QR'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Scan Dynamic UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('ID')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        upiSubMode === 'ID'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Enter UPI ID / VPA
                    </button>
                  </div>

                  {upiSubMode === 'QR' ? (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                      {/* Stylized SVG QR Code */}
                      <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md shrink-0">
                        <svg
                          viewBox="0 0 120 120"
                          className="w-32 h-32 text-slate-900"
                          fill="currentColor"
                        >
                          <rect x="8" y="8" width="32" height="32" rx="4" />
                          <rect
                            x="14"
                            y="14"
                            width="20"
                            height="20"
                            fill="white"
                          />
                          <rect x="20" y="20" width="8" height="8" />

                          <rect x="80" y="8" width="32" height="32" rx="4" />
                          <rect
                            x="86"
                            y="14"
                            width="20"
                            height="20"
                            fill="white"
                          />
                          <rect x="92" y="20" width="8" height="8" />

                          <rect x="8" y="80" width="32" height="32" rx="4" />
                          <rect
                            x="14"
                            y="86"
                            width="20"
                            height="20"
                            fill="white"
                          />
                          <rect x="20" y="92" width="8" height="8" />

                          {/* Data matrix dots */}
                          <rect x="48" y="12" width="8" height="8" />
                          <rect x="62" y="12" width="8" height="16" />
                          <rect x="48" y="28" width="10" height="8" />
                          <rect x="12" y="48" width="16" height="8" />
                          <rect x="34" y="48" width="8" height="16" />
                          <rect x="50" y="48" width="20" height="20" rx="3" fill="#059669" />
                          <rect x="78" y="48" width="12" height="8" />
                          <rect x="96" y="48" width="14" height="14" />
                          <rect x="48" y="76" width="12" height="12" />
                          <rect x="68" y="72" width="8" height="20" />
                          <rect x="84" y="76" width="24" height="10" />
                          <rect x="48" y="96" width="20" height="12" />
                          <rect x="76" y="96" width="12" height="14" />
                          <rect x="96" y="94" width="16" height="16" />
                        </svg>
                      </div>
                      <div className="space-y-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{upiApp} Merchant QR Ready</span>
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Scan with {upiApp} or any UPI App
                        </h3>
                        <p className="text-slate-500">
                          Merchant: <span className="font-semibold text-slate-800">DRIVEAI.RENTALS@AXIS</span>
                        </p>
                        <p className="text-slate-500">
                          Booking Ref:{' '}
                          <span className="font-mono font-bold text-indigo-600">
                            {selectedBooking?.booking_reference || 'Select a booking'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        Virtual Payment Address (UPI ID)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setUpiVerified(false);
                          }}
                          placeholder="yourname@okicici"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setUpiVerified(true)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Verify VPA
                        </button>
                      </div>
                      {upiVerified && upiId.includes('@') && (
                        <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Verified Banking Name: {user?.name?.toUpperCase() || 'AARAV SHARMA'} ({upiApp})
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: CREDIT / DEBIT CARD INTERACTIVE TERMINAL */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-5">
                  {/* Live Visual Credit Card Preview */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 text-white shadow-lg space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                        DriveAI Secure Card Vault
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white/15 text-xs font-extrabold tracking-wider">
                        {cardDetails.network}
                      </span>
                    </div>
                    <div className="font-mono text-xl sm:text-2xl tracking-widest font-bold">
                      {cardDetails.number || '4532 •••• •••• 8891'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Cardholder Name
                        </span>
                        <span className="font-bold tracking-wider uppercase">
                          {cardDetails.name || 'AARAV SHARMA'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Expires
                        </span>
                        <span className="font-mono font-bold">
                          {cardDetails.expiry || '08/29'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, number: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              expiry: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, cvv: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: CASH AT HUB VOUCHER */}
              {paymentMethod === 'CASH' && (
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>Pay at DriveAI Pickup Hub Counter</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Your booking will be immediately confirmed in PostgreSQL and a
                    Cash/POS Authorization Reference (`TXN-CSH-...`) will be
                    issued for vehicle handover at{' '}
                    <span className="font-bold">
                      {selectedBooking?.vehicle?.location || 'Main City Hub'}
                    </span>
                    .
                  </p>
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">
                      Pickup Desk Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={cashNotes}
                      onChange={(e) => setCashNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* MODE 4: 1-CLICK PROTOTYPE DEMO */}
              {paymentMethod === 'DEMO' && (
                <div className="p-5 rounded-2xl bg-violet-50 border border-violet-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-violet-950 font-extrabold text-sm">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    <span>1-Click College Evaluation Demo Mode</span>
                  </div>
                  <p className="text-violet-800 leading-relaxed">
                    Designed for rapid academic demonstration: executes the full
                    SQLAlchemy atomic transaction (`payments` insert, `bookings`
                    status update, `vehicles` status update, `availability` window
                    log, and `notifications` alert) in a single click.
                  </p>
                </div>
              )}

              {/* ACID Rollback Simulation Toggle */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer text-xs text-amber-950">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div>
                  <span className="font-bold block">
                    Simulate Payment Gateway Failure (Test PostgreSQL ACID ROLLBACK)
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Leave unchecked for normal payment confirmation. Check to verify
                    that a mid-transaction failure rolls back all changes cleanly.
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={processing || !selectedBooking}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  simulateFailure
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {processing
                    ? 'Executing Atomic PostgreSQL Transaction...'
                    : !selectedBooking
                    ? 'Select or Generate a Pending Booking First'
                    : simulateFailure
                    ? `Test Failing ${paymentMethod} Payment (Trigger ROLLBACK)`
                    : `Authorize & Pay ₹${Number(
                        selectedBooking.subtotal
                      ).toLocaleString('en-IN')} via ${paymentMethod}`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Section: Customer Payment History & Printable Invoices */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Your Payment Transactions & Digital Invoices ({payments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live records from the PostgreSQL <code className="font-mono">payments</code> table
            </p>
          </div>

          {/* Filter by Paying Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'UPI', 'CARD', 'CASH', 'DEMO'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  methodFilter === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m === 'ALL' ? 'All Modes' : m}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
            No payment records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Transaction Ref</th>
                  <th className="py-3 px-3">Booking Ref</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Paying Mode</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Paid At</th>
                  <th className="py-3 px-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {p.transaction_reference}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-600">
                      {p.booking_reference}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      {p.vehicle_name}
                      <div className="text-[10px] font-mono text-slate-500">
                        {p.vehicle_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInvoiceModalPayment(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px]"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Official Receipt / Tax Invoice Modal */}
      {invoiceModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                  DriveAI Smart Rental DBMS • Official Tax Receipt
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Payment Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalPayment(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  {invoiceModalPayment.transaction_reference}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Booking Reference</span>
                <span className="font-mono font-bold text-indigo-600">
                  {invoiceModalPayment.booking_reference}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalPayment.customer_name || user?.name}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-bold text-slate-900">
                  {invoiceModalPayment.vehicle_name} (
                  {invoiceModalPayment.vehicle_number})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Rental Period</span>
                <span className="font-semibold text-slate-800">
                  {invoiceModalPayment.start_date} →{' '}
                  {invoiceModalPayment.end_date}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Paying Mode</span>
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700">
                  {invoiceModalPayment.payment_method}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Status</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {invoiceModalPayment.payment_status}
                </span>
              </div>
              <div className="flex justify-between pt-3 text-base font-extrabold text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-emerald-600">
                  ₹{Number(invoiceModalPayment.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModalPayment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
