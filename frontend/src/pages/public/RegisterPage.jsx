import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    preferred_vehicle_type: 'SUV',
    preferred_transmission: 'Automatic',
    preferred_fuel: 'Petrol',
    preferred_seats: 5,
    budget_per_day: 4000,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        preferred_vehicle_type: form.preferred_vehicle_type,
        preferred_transmission: form.preferred_transmission,
        preferred_fuel: form.preferred_fuel,
        preferred_seats: Number(form.preferred_seats),
        budget_per_day: Number(form.budget_per_day),
      });
      navigate('/customer/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Registration failed. Please check your details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillNewTestCustomer = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setForm({
      name: `Customer Demo ${randomId}`,
      email: `customer_${randomId}@example.com`,
      phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'password123',
      confirmPassword: 'password123',
      preferred_vehicle_type: 'SUV',
      preferred_transmission: 'Automatic',
      preferred_fuel: 'Petrol',
      preferred_seats: 5,
      budget_per_day: 3500,
    });
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Create Customer Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set your account details and AI vehicle preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillNewTestCustomer}
            className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            title="Click to auto-generate a fresh, unique demo customer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Generate New Test Email</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already exists') && (
              <div className="pt-1 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between">
                <span>Did you already register this email before?</span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Sign In to Your Account &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Aditya Rao"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="aditya@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+91-9845099887"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* AI Recommendation Preferences */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold">
                AI Vehicle Recommendation Preferences
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Preferred Type
                </label>
                <select
                  name="preferred_vehicle_type"
                  value={form.preferred_vehicle_type}
                  onChange={handleChange}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="SUV">SUV</option>
                  <option value="Electric">Electric</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Transmission
                </label>
                <select
                  name="preferred_transmission"
                  value={form.preferred_transmission}
                  onChange={handleChange}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Fuel Type
                </label>
                <select
                  name="preferred_fuel"
                  value={form.preferred_fuel}
                  onChange={handleChange}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Preferred Seats
                </label>
                <select
                  name="preferred_seats"
                  value={form.preferred_seats}
                  onChange={handleChange}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value={5}>5 Seats</option>
                  <option value={7}>7 Seats</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Daily Budget (₹ / Day)
                </label>
                <input
                  type="number"
                  name="budget_per_day"
                  min={1000}
                  step={100}
                  required
                  value={form.budget_per_day}
                  onChange={handleChange}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md transition-colors"
          >
            {submitting
              ? 'Creating Account & Scoring Fleet...'
              : 'Create Account & Generate AI Recommendations'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
