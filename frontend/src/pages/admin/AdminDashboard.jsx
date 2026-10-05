import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Car,
  CheckCircle2,
  Activity,
  CalendarCheck,
  Award,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/summary')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  const { kpis, charts, tables } = data;

  const kpiCards = [
    {
      label: 'Total Customers',
      value: kpis.total_customers,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Vehicles',
      value: kpis.total_vehicles,
      icon: Car,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Available Vehicles',
      value: kpis.available_vehicles,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Active Rentals',
      value: kpis.active_rentals,
      icon: Activity,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total Bookings',
      value: kpis.total_bookings,
      icon: CalendarCheck,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Completed Rentals',
      value: kpis.completed_rentals,
      icon: Award,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Total Revenue',
      value: `₹${Number(kpis.total_revenue).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Executive DBMS Analytics
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            System Overview Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Open 12 SQL Reports
          </Link>
          <Link
            to="/admin/demand"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
          >
            AI Demand Forecast
          </Link>
        </div>
      </div>

      {/* 7 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {c.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-3">
                {c.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6 Charts Grid (3 Rows × 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            1. Monthly Bookings Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="bookings"
                  name="Bookings"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            2. Monthly Revenue (₹)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthly_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#e11d48"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Vehicle Utilization */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            3. Vehicle Utilization (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(charts.vehicle_utilization || []).slice(0, 8)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={11} />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={100}
                  fontSize={10}
                />
                <Tooltip />
                <Bar
                  dataKey="utilization_percentage"
                  name="Utilization %"
                  fill="#10b981"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Vehicle Type Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            4. Fleet Vehicle Type Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.vehicle_type_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(charts.vehicle_type_distribution || []).map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Booking Status Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            5. Booking Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.booking_status_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Bookings"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Demand Analysis (Historical vs Predicted) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            6. Demand-Oriented Analysis (Historical vs Predicted)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.demand_by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vehicle_type" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="historical_rentals"
                  name="Historical Rentals"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="predicted_demand"
                  name="Predicted Demand"
                  fill="#e11d48"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4 Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Bookings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent Bookings
            </h3>
            <Link
              to="/admin/bookings"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Manage All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2">Ref</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tables.recent_bookings || []).slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 font-mono font-bold text-indigo-600">
                      {b.booking_reference}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800">
                      {b.customer_name}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900">
                      ₹{Number(b.subtotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Payments */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Recent Payments
            </h3>
            <Link
              to="/admin/payments"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View Ledger
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2">Transaction Ref</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tables.recent_payments || []).slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono font-bold text-slate-800">
                      {p.transaction_reference}
                    </td>
                    <td className="py-2.5 text-slate-600">{p.customer_name}</td>
                    <td className="py-2.5 font-semibold">{p.payment_method}</td>
                    <td className="py-2.5 font-bold text-emerald-700">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Active Rentals */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Active & Confirmed Rentals ({tables.active_rentals?.length || 0})
            </h3>
            <Link
              to="/admin/returns"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Process Returns
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2">Booking</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Dates</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tables.active_rentals || []).map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 font-mono font-bold text-indigo-600">
                      {b.booking_reference}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800">
                      {b.customer_name}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {b.start_date} → {b.end_date}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4: Vehicles Needing Attention */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Vehicles Needing Attention</span>
            </h3>
            <Link
              to="/admin/vehicles"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Fleet Maintenance
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                  <th className="py-2">Reg No.</th>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Attention Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tables.vehicles_needing_attention || []).map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 font-mono font-bold text-rose-600">
                      {v.vehicle_number}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-900">
                      {v.name}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {v.attention_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
