import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ShieldCheck,
  Database,
  Cpu,
  ArrowRight,
  CheckCircle2,
  CalendarClock,
  CreditCard,
} from 'lucide-react';
import api from '../../services/api';
import VehicleCard from '../../components/VehicleCard';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick search form state
  const [vehicleType, setVehicleType] = useState('ALL');
  const [transmission, setTransmission] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    api
      .get('/vehicles')
      .then((res) => {
        setFeaturedVehicles((res.data || []).slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (vehicleType !== 'ALL') params.set('vehicle_type', vehicleType);
    if (transmission !== 'ALL') params.set('transmission', transmission);
    if (maxPrice) params.set('max_price', maxPrice);
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Driven Vehicle Rental Management System</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Intelligent Fleet Booking Powered by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                Explainable AI & PostgreSQL
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Experience personalized 100-point weighted vehicle recommendations,
              real-time conflict-free date availability, atomic ACID booking &
              payment transactions, and automated return billing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/60 transition-all"
              >
                <span>Browse Fleet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {user ? (
                <Link
                  to={
                    user.role === 'ADMIN'
                      ? '/admin/dashboard'
                      : '/customer/dashboard'
                  }
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                >
                  <span>Go to {user.role === 'ADMIN' ? 'Admin Console' : 'My Dashboard'}</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                  >
                    Register Customer
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interactive Search Widget */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleHeroSearch}
              className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Quick Vehicle Finder
                  </h2>
                  <p className="text-xs text-slate-500">
                    Search live PostgreSQL fleet inventory
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live DB
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="ALL">All Categories (SUV, Sedan, EV, Luxury...)</option>
                    <option value="SUV">SUV</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Transmission
                    </label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="ALL">Any</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Max Daily Budget (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 4500"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Available Vehicles</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Live Fleet Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Rental Vehicles
            </h2>
          </div>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>View Full 12+ Fleet</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendation Highlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Cpu className="w-4 h-4" />
              <span>Explainable 100-Point AI Scoring Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              How Our AI Recommends Your Ideal Vehicle
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Instead of opaque black-box guesses, our Python AI recommendation
              engine computes a transparent 100-point compatibility score based
              on your saved preferences and historical rental patterns, storing
              every recommendation directly in PostgreSQL.
            </p>
            <div className="pt-2">
              <Link
                to={user ? '/customer/recommendations' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-slate-900 hover:bg-indigo-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>View My Personalized AI Matches</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Vehicle Type Match', pts: '25 pts' },
              { label: 'Daily Budget Fit', pts: '20 pts' },
              { label: 'Rental History Affinity', pts: '20 pts' },
              { label: 'Transmission Match', pts: '15 pts' },
              { label: 'Fuel Type Match', pts: '10 pts' },
              { label: 'Seating Capacity', pts: '10 pts' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm flex flex-col justify-between"
              >
                <span className="text-slate-300 font-medium">{item.label}</span>
                <span className="text-lg font-extrabold text-indigo-300 mt-1">
                  {item.pts}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            End-to-End DBMS Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How the Rental Lifecycle Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Sparkles,
              step: '01',
              title: 'AI Discovery & Filter',
              desc: 'Set your preferences and let the AI score available vehicles or filter by SUV, transmission, fuel, and budget.',
            },
            {
              icon: CalendarClock,
              step: '02',
              title: 'Conflict-Free Date Check',
              desc: 'Server-side SQL date overlap validation prevents double-booking across active and confirmed reservations.',
            },
            {
              icon: CreditCard,
              step: '03',
              title: 'ACID Transaction Checkout',
              desc: 'Booking, payment, vehicle status update, and notification commit atomically—or roll back cleanly on failure.',
            },
            {
              icon: CheckCircle2,
              step: '04',
              title: 'Return & Automated Bill',
              desc: 'Inspect vehicle condition, compute late/damage fees, archive to rental history, and release vehicle.',
            },
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 font-mono">
                    STEP {s.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
