import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  History,
  Car,
  CreditCard,
  RotateCcw,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VehicleCard from '../../components/VehicleCard';

export default function CustomerDashboard() {
  const { user, refreshNotifications } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [profRes, bookRes, recRes] = await Promise.all([
          api.get('/customers/me'),
          api.get('/bookings'),
          api.get('/recommendations/me'),
        ]);
        setProfile(profRes.data);
        setBookings(bookRes.data || []);
        setRecommendations((recRes.data.recommendations || []).slice(0, 3));
        refreshNotifications();
      } catch {
        // handled gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshNotifications]);

  const activeBookings = bookings.filter((b) => b.status === 'ACTIVE');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  );
  const completedCount = bookings.filter(
    (b) => b.status === 'COMPLETED'
  ).length;

  const handleQuickSearch = (e) => {
    e.preventDefault();
    navigate(`/vehicles?search=${encodeURIComponent(quickSearch)}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-36 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Portal • Live PostgreSQL Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {profile?.name || user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Saved AI Profile:{' '}
            <span className="font-semibold text-white">
              {profile?.preferred_vehicle_type} • {profile?.preferred_transmission} •{' '}
              {profile?.preferred_fuel} • {profile?.preferred_seats} Seats • Budget ₹
              {Number(profile?.budget_per_day || 4000).toLocaleString('en-IN')}/day
            </span>
          </p>
        </div>

        {/* Quick Search Bar */}
        <form
          onSubmit={handleQuickSearch}
          className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-sm w-full lg:w-96"
        >
          <Search className="w-4 h-4 text-slate-300 ml-2 shrink-0" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search brand, model, SUV, EV..."
            className="bg-transparent text-white placeholder-slate-300 text-xs sm:text-sm w-full focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Rentals
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeBookings.length}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Currently on road
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Bookings
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {upcomingBookings.length}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Confirmed / Pending
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rental History Count
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {completedCount}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Completed trips
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Lifetime Spend
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{Number(profile?.total_spent || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-violet-600 font-semibold mt-1">
              Verified paid transactions
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active & Upcoming Rentals Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Active & Upcoming Bookings
            </h2>
            <p className="text-xs text-slate-500">
              Manage payments, view booking status, or return an active rental vehicle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/customer/payments"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay & Modes</span>
            </Link>
            <Link
              to="/customer/rentals"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              Open Return Center
            </Link>
            <Link
              to="/customer/history"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Full History
            </Link>
          </div>
        </div>

        {activeBookings.length === 0 && upcomingBookings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <p className="text-sm font-bold text-slate-700">
              No active or upcoming bookings right now
            </p>
            <p className="text-xs text-slate-500">
              Explore our AI-recommended vehicles below to book your next ride.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
            >
              <span>Browse Vehicles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Booking Ref</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Rental Dates</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Booking Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...activeBookings, ...upcomingBookings].map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-600">
                      {b.booking_reference}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {b.vehicle?.brand} {b.vehicle?.model}
                      <div className="text-[11px] font-normal text-slate-500">
                        {b.vehicle?.vehicle_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {b.start_date} → {b.end_date} ({b.total_days}d)
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      ₹{Number(b.subtotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {b.payment_status !== 'PAID' && b.status === 'PENDING' && (
                        <Link
                          to={`/customer/payment/${b.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </Link>
                      )}
                      {(b.status === 'ACTIVE' || b.status === 'CONFIRMED') && (
                        <Link
                          to={`/customer/rentals?returnBookingId=${b.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return Vehicle</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top AI Recommended Vehicles */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Explainable AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Top Recommended Vehicles For You
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/customer/profile"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Preferences</span>
            </Link>
            <Link
              to="/customer/recommendations"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>See All AI Scores & Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <VehicleCard
              key={rec.vehicle_id}
              vehicle={rec.vehicle}
              aiScore={rec.score}
              aiReason={rec.reason}
              matchingFactors={rec.matching_factors}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
