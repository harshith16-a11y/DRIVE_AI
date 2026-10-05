import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Banknote,
  Sparkles,
  QrCode,
  Building2,
  Printer,
  ArrowRight,
  RotateCcw,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VehicleIllustration from '../../components/VehicleIllustration';

export default function BookingPaymentPage() {
  const { bookingId } = useParams();
  const { user, refreshNotifications } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Interactive Mode State
  const [upiSubMode, setUpiSubMode] = useState('QR');
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

  const [cashNotes, setCashNotes] = useState(
    'Will pay at pickup counter 15 mins before start'
  );

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch {
      setErrorMsg('Booking not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handlePayNow = async () => {
    if (paymentMethod === 'UPI' && upiSubMode === 'ID' && !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g., name@okaxis).');
      return;
    }
    setProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.post('/payments', {
        booking_id: Number(bookingId),
        payment_method: paymentMethod,
        simulate_failure: simulateFailure,
      });
      setPaymentSuccess(res.data);
      setBooking(res.data.booking);
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Payment could not be completed.'
      );
      await fetchBooking();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <Link
          to="/customer/payments"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Go to Payments & Paying Modes
        </Link>
      </div>
    );
  }

  const isPaid = booking.payment_status === 'PAID';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Step 8 • Multi-Mode Payment Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isPaid
              ? 'Booking Confirmed & Paid'
              : 'Select Paying Mode & Complete Payment'}
          </h1>
        </div>
        <Link
          to="/customer/payments"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
        >
          All Payments & Invoices
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Booking & Vehicle Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {booking.vehicle && (
              <VehicleIllustration
                vehicle={booking.vehicle}
                className="h-48 w-full"
              />
            )}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">
                  Booking Reference
                </span>
                <span className="font-mono font-bold text-sm text-indigo-600">
                  {booking.booking_reference}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-bold text-slate-900">
                  {booking.vehicle?.brand} {booking.vehicle?.model}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registration No.</span>
                <span className="font-mono font-semibold text-slate-800">
                  {booking.vehicle?.vehicle_number}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rental Period</span>
                <span className="font-semibold text-slate-900">
                  {booking.start_date} → {booking.end_date}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Days × Daily Rate</span>
                <span className="font-semibold text-slate-900">
                  {booking.total_days} days × ₹
                  {Number(booking.daily_rate).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                <span>Total Payable Amount</span>
                <span className="text-indigo-600">
                  ₹{Number(booking.subtotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Gateway Simulator OR Confirmation Receipt */}
        <div className="lg:col-span-7">
          {isPaid || paymentSuccess ? (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      ACID Transaction Committed
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Payment Successful & Booking Confirmed!
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Reference</span>
                  <span className="font-mono font-bold text-slate-900">
                    {booking.payment?.transaction_reference ||
                      paymentSuccess?.payment?.transaction_reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    PAID
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paying Mode</span>
                  <span className="px-2.5 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800">
                    {booking.payment?.payment_method || paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated Booking Status</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated Vehicle Status</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                    {booking.vehicle?.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to={`/customer/rentals?returnBookingId=${booking.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Go to Active Rentals / Return Vehicle</span>
                </Link>
                <Link
                  to="/customer/payments"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <span>All Payments & Invoices</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Choose Your Paying Mode
                </h2>
                <p className="text-xs text-slate-500">
                  Executes an atomic PostgreSQL transaction updating payment,
                  booking confirmation, vehicle status, and notifications.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Payment Method Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'UPI',
                    title: 'UPI Instant',
                    desc: 'GPay / PhonePe / Paytm / QR',
                    icon: Smartphone,
                  },
                  {
                    id: 'CARD',
                    title: 'Credit / Debit Card',
                    desc: 'Visa / Mastercard / RuPay',
                    icon: CreditCard,
                  },
                  {
                    id: 'CASH',
                    title: 'Cash at Hub',
                    desc: 'Pay at pickup location',
                    icon: Banknote,
                  },
                  {
                    id: 'DEMO',
                    title: '1-Click Demo Pay',
                    desc: 'Instant College Prototype Pay',
                    icon: Sparkles,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          className={`w-5 h-5 ${
                            active ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {m.id}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-bold text-slate-900">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Paying Mode Details */}
              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      UPI App & Mode
                    </span>
                    <div className="flex gap-1.5">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            upiApp === app
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 p-1 bg-slate-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('QR')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        upiSubMode === 'QR'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Scan UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiSubMode('ID')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                        upiSubMode === 'ID'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Enter UPI ID
                    </button>
                  </div>

                  {upiSubMode === 'QR' ? (
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-500 shrink-0">
                        <QrCode className="w-16 h-16 text-slate-900" />
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-900">
                          Scan with {upiApp} to Pay ₹
                          {Number(booking.subtotal).toLocaleString('en-IN')}
                        </div>
                        <div className="text-slate-500">
                          Merchant VPA:{' '}
                          <span className="font-mono font-bold text-slate-800">
                            DRIVEAI.RENTALS@AXIS
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setUpiVerified(false);
                          }}
                          placeholder="username@okaxis"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setUpiVerified(true)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                        >
                          Verify
                        </button>
                      </div>
                      {upiVerified && (
                        <div className="text-[11px] font-bold text-emerald-700">
                          ✓ Verified VPA ({upiApp})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
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
                          setCardDetails({
                            ...cardDetails,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
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
                            setCardDetails({
                              ...cardDetails,
                              cvv: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>
                      Cash / POS at {booking.vehicle?.location || 'Main Hub'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={cashNotes}
                    onChange={(e) => setCashNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800"
                  />
                </div>
              )}

              {/* Rollback Simulation Toggle */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer text-xs text-amber-950">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div>
                  <span className="font-bold block">
                    Simulate Payment Failure (Demonstrate Transaction ROLLBACK)
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Leave unchecked for normal payment confirmation. Check to
                    demonstrate PostgreSQL ROLLBACK on payment failure.
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={processing}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {processing
                    ? 'Processing Atomic Database Transaction...'
                    : `Pay Now ₹${Number(booking.subtotal).toLocaleString(
                        'en-IN'
                      )} (${paymentMethod})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
