import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Gauge,
  Fuel,
  Users,
  Palette,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldAlert,
  Wrench,
  ShieldCheck,
  Navigation,
  Activity,
  ClipboardCheck,
  FileCheck2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VehicleIllustration from '../../components/VehicleIllustration';

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshNotifications } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date selection (default: 3 days)
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-18');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Booking / Transaction state
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [simulateRollback, setSimulateRollback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vehicles/${id}`);
      setVehicle(res.data);
    } catch {
      setErrorMsg('Vehicle not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const handleCheckAvailability = async () => {
    setCheckingAvail(true);
    setErrorMsg('');
    setAvailabilityResult(null);
    try {
      const res = await api.get(`/vehicles/${id}/availability`, {
        params: { start_date: startDate, end_date: endDate },
      });
      setAvailabilityResult(res.data);
      if (!res.data.available) {
        setErrorMsg(res.data.message);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Could not validate dates.'
      );
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleCreateBookingAndPayStep = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessData(null);
    try {
      const res = await api.post('/bookings', {
        vehicle_id: Number(id),
        start_date: startDate,
        end_date: endDate,
      });
      await refreshNotifications();
      navigate(`/customer/payment/${res.data.id}`);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to create booking.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAtomicTransactionalCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessData(null);
    try {
      const res = await api.post('/bookings/transactional', {
        vehicle_id: Number(id),
        start_date: startDate,
        end_date: endDate,
        payment_method: paymentMethod,
        simulate_failure: simulateRollback,
      });
      setSuccessData(res.data);
      await fetchVehicle();
      await refreshNotifications();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          'Transaction failed and was rolled back.'
      );
      await fetchVehicle();
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedDays = (() => {
    if (!startDate || !endDate) return 0;
    const diff =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 3600 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  })();

  const estimatedTotal = vehicle
    ? calculatedDays * Number(vehicle.daily_rate)
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Vehicle not found</h2>
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Back to Fleet
        </Link>
      </div>
    );
  }

  const coveredKms = vehicle.covered_kms || 14280;
  const nextServiceKm = vehicle.next_service_due_km || 20000;
  const kmsUntilService = vehicle.kms_until_service || 5720;
  const serviceProgressPct = Math.min(
    95,
    Math.round((coveredKms / nextServiceKm) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/vehicles"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vehicle Fleet</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Vehicle Image, Specifications, Covered KMs, Condition & Maintenance */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Card: Visual & Specifications */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <VehicleIllustration
              vehicle={vehicle}
              className="h-72 sm:h-80 w-full"
            />
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {vehicle.brand} • {vehicle.vehicle_type} • {vehicle.year}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>{vehicle.location}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-slate-700">
                      Reg: {vehicle.vehicle_number}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      vehicle.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : vehicle.status === 'BOOKED'
                        ? 'bg-amber-100 text-amber-800'
                        : vehicle.status === 'RENTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {vehicle.status}
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">
                    ₹{Number(vehicle.daily_rate).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500">
                      {' '}
                      / day
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {vehicle.description}
              </p>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    <span>Transmission</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {vehicle.transmission}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    <span>Fuel Type</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {vehicle.fuel_type}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Seating</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {vehicle.seats} Passengers
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Palette className="w-4 h-4 text-violet-600" />
                    <span>Exterior Color</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {vehicle.color}
                  </div>
                </div>
              </div>

              {/* Existing Booked Date Windows */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Reserved Date Windows (Double-Booking Protected)
                </h3>
                {!vehicle.booked_dates || vehicle.booked_dates.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold">
                    No conflicting reservations — open for immediate booking!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {vehicle.booked_dates.map((bd, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setStartDate(bd.start_date);
                          setEndDate(bd.end_date);
                        }}
                        title="Click to autofill these dates and test Double-Booking Prevention!"
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
                      >
                        {bd.start_date} → {bd.end_date} ({bd.status}) [Click to Test Overlap]
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Odometer (Covered KMs), Condition Grade & Multi-Point Health Diagnostics */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Live Vehicle Telemetry & Inspection Report
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Covered KMs, Condition & Maintenance Details
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span>{vehicle.condition_grade || 'Excellent (A+ Grade)'}</span>
              </span>
            </div>

            {/* Odometer & Condition Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Covered KMs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <span>Total Covered KMs</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {Number(coveredKms).toLocaleString('en-IN')} km
                </div>
                <div className="text-[11px] text-slate-500">
                  Verified digital odometer reading
                </div>
              </div>

              {/* Current Condition */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Vehicle Condition</span>
                </div>
                <div className="text-lg font-extrabold text-emerald-900">
                  {vehicle.condition_badge || 'Excellent (Good)'}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  Overall Health Score: {vehicle.overall_health_pct || 98}%
                </div>
              </div>

              {/* Next Service Schedule */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Last Serviced Date</span>
                </div>
                <div className="text-lg font-extrabold text-amber-950 font-mono">
                  {vehicle.last_service_date || '2026-08-25'}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold">
                  Next Due at {Number(nextServiceKm).toLocaleString('en-IN')} km (
                  {Number(kmsUntilService).toLocaleString('en-IN')} km left)
                </div>
              </div>
            </div>

            {/* Service Interval Progress Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Odometer vs. Next Preventive Service Interval</span>
                <span className="font-mono text-indigo-600">
                  {Number(coveredKms).toLocaleString('en-IN')} /{' '}
                  {Number(nextServiceKm).toLocaleString('en-IN')} km ({serviceProgressPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full"
                  style={{ width: `${serviceProgressPct}%` }}
                />
              </div>
            </div>

            {/* 4-Subsystem Mechanical Health Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                {
                  label:
                    vehicle.fuel_type === 'Electric'
                      ? 'EV Motor & Inverter'
                      : 'Engine & Powertrain',
                  pct: vehicle.engine_health_pct || 98,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Tires & Tread Depth',
                  pct: vehicle.tire_health_pct || 95,
                  color: 'bg-indigo-500',
                },
                {
                  label: 'ABS Brakes & Rotors',
                  pct: vehicle.brake_health_pct || 97,
                  color: 'bg-cyan-500',
                },
                {
                  label: 'Battery & Electronics',
                  pct: vehicle.battery_health_pct || 99,
                  color: 'bg-violet-500',
                },
              ].map((sys, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">
                      {sys.label}
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {sys.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${sys.color} rounded-full`}
                      style={{ width: `${sys.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Maintenance & Workshop Summary */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-sm text-indigo-950">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>Authorized Workshop & Maintenance Summary</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {vehicle.maintenance_summary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-indigo-200/70 text-[11px]">
                <div>
                  <span className="text-slate-500 block">
                    Authorized Service Partner
                  </span>
                  <span className="font-bold text-slate-900">
                    {vehicle.service_center}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    Insurance & Emission Compliance
                  </span>
                  <span className="font-bold text-slate-900">
                    {vehicle.insurance_status} • {vehicle.pollution_cert}
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Point Maintenance Checklist */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <span>5-Point Preventive Maintenance Checklist</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(vehicle.maintenance_checklist || []).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="font-medium text-slate-700">{c.item}</span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800 shrink-0 ml-2">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Return Condition Inspections from PostgreSQL `returns` Table */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>
                  PostgreSQL Return Inspection History (
                  {(vehicle.inspection_logs || []).length})
                </span>
              </h3>
              {!vehicle.inspection_logs ||
              vehicle.inspection_logs.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No past return damage incidents — pristine showroom condition.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {vehicle.inspection_logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800">
                          {log.return_date}
                        </span>
                        <span className="mx-2 text-slate-400">•</span>
                        <span className="text-slate-600">{log.notes}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.condition === 'Good'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Condition: {log.condition}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Availability Check, Booking & ACID Transaction Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-5 sticky top-20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Reservation & ACID Checkout
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Select Rental Dates
              </h2>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setAvailabilityResult(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checkingAvail}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>
                {checkingAvail
                  ? 'Checking PostgreSQL Availability...'
                  : 'Step 1: Check Date Availability'}
              </span>
            </button>

            {/* Availability Status Banner */}
            {availabilityResult && availabilityResult.available && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Available for Booking!</div>
                  <div>{availabilityResult.message}</div>
                </div>
              </div>
            )}

            {/* Error / Double-booking or Rollback Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Operation Rejected / Rolled Back</div>
                  <div className="mt-0.5">{errorMsg}</div>
                </div>
              </div>
            )}

            {/* Success Confirmation Banner */}
            {successData && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>ACID Transaction COMMITTED!</span>
                </div>
                <p>
                  Booking Ref:{' '}
                  <span className="font-mono font-bold">
                    {successData.booking?.booking_reference}
                  </span>
                </p>
                <p>
                  Transaction Ref:{' '}
                  <span className="font-mono font-bold">
                    {successData.booking?.payment?.transaction_reference}
                  </span>
                </p>
                <p>
                  Booking Status:{' '}
                  <span className="font-bold">
                    {successData.booking?.status}
                  </span>{' '}
                  • Vehicle Status:{' '}
                  <span className="font-bold">
                    {successData.booking?.vehicle?.status}
                  </span>
                </p>
                <div className="pt-2 flex gap-2">
                  <Link
                    to="/customer/rentals"
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                  >
                    View Active Rentals / Return
                  </Link>
                  <Link
                    to="/customer/payments"
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold"
                  >
                    Pay & Modes
                  </Link>
                </div>
              </div>
            )}

            {/* Server Cost Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Daily Rate</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(vehicle.daily_rate).toLocaleString('en-IN')} / day
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rental Duration (end_date - start_date)</span>
                <span className="font-bold text-slate-900">
                  {calculatedDays > 0 ? `${calculatedDays} Days` : 'Invalid range'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Calculated Subtotal</span>
                <span className="text-indigo-600">
                  ₹{estimatedTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Option A: Standard 2-step Booking -> Demo Payment Page */}
            <button
              type="button"
              onClick={handleCreateBookingAndPayStep}
              disabled={submitting || calculatedDays <= 0}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing...'
                  : 'Step 2: Create Booking & Select Paying Mode'}
              </span>
            </button>

            {/* Option B: Direct Atomic Transaction + Rollback Simulator for DBMS Faculty Demo */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  DBMS Transaction & Rollback Demonstrator
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1 font-semibold"
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="CASH">CASH</option>
                  <option value="DEMO">DEMO Payment</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer text-xs text-amber-950">
                <input
                  type="checkbox"
                  checked={simulateRollback}
                  onChange={(e) => setSimulateRollback(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600"
                />
                <div>
                  <span className="font-bold block">
                    Simulate Payment Failure (Test ACID Rollback — Step 30)
                  </span>
                  <span className="text-[11px] text-amber-800">
                    When checked, PostgreSQL flushes Booking + Payment + Vehicle
                    status inside a transaction, then triggers an error to prove
                    ROLLBACK leaves zero inconsistent records.
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={handleAtomicTransactionalCheckout}
                disabled={submitting || calculatedDays <= 0}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                  simulateRollback
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {simulateRollback
                    ? 'Execute Failing Transaction (Verify ROLLBACK)'
                    : `Instant 1-Click Atomic Booking + ${paymentMethod} Pay`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
