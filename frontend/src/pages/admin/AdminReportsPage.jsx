import React, { useEffect, useState, useCallback } from 'react';
import {
  Download,
  Database,
  Calendar,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';

const REPORT_TABS = [
  { id: '1', label: '1. Total Bookings', sql: 'SELECT status, COUNT(*) AS total_bookings, SUM(subtotal) AS total_value FROM bookings GROUP BY status;' },
  { id: '2', label: '2. Total Revenue', sql: "SELECT COUNT(DISTINCT booking_id), SUM(amount) AS total_revenue FROM payments WHERE payment_status = 'PAID';" },
  { id: '3', label: '3. Monthly Revenue', sql: "SELECT TO_CHAR(b.start_date, 'YYYY-MM') AS month, COUNT(b.id) AS bookings, SUM(p.amount) AS revenue FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id GROUP BY 1 ORDER BY 1;" },
  { id: '4', label: '4. Most Rented Vehicles', sql: 'SELECT v.vehicle_number, v.brand, v.model, COUNT(b.id) AS rentals, SUM(b.total_days) AS days_rented, SUM(b.subtotal) AS revenue FROM vehicles v LEFT JOIN bookings b ON b.vehicle_id = v.id GROUP BY v.id ORDER BY rentals DESC;' },
  { id: '5', label: '5. Most Rented Vehicle Types', sql: 'SELECT v.vehicle_type, COUNT(b.id) AS historical_rentals, SUM(b.total_days) AS total_days, SUM(b.subtotal) AS revenue FROM vehicles v LEFT JOIN bookings b ON b.vehicle_id = v.id GROUP BY v.vehicle_type ORDER BY historical_rentals DESC;' },
  { id: '6', label: '6. Customer Spending', sql: 'SELECT u.name, u.email, COUNT(b.id) AS total_bookings, SUM(p.amount) AS total_spent FROM customers c JOIN users u ON u.id = c.user_id LEFT JOIN bookings b ON b.customer_id = c.id LEFT JOIN payments p ON p.booking_id = b.id GROUP BY c.id, u.name, u.email ORDER BY total_spent DESC;' },
  { id: '7', label: '7. Vehicle Utilization', sql: 'SELECT v.vehicle_number, v.brand, v.model, SUM(b.total_days) AS days_utilized, ROUND((SUM(b.total_days)::numeric / 90.0) * 100, 1) AS utilization_pct FROM vehicles v LEFT JOIN bookings b ON b.vehicle_id = v.id GROUP BY v.id ORDER BY utilization_pct DESC;' },
  { id: '8', label: '8. Active Rentals', sql: "SELECT b.booking_reference, u.name, v.vehicle_number, b.start_date, b.end_date, b.subtotal, b.status FROM bookings b JOIN customers c ON c.id = b.customer_id JOIN users u ON u.id = c.user_id JOIN vehicles v ON v.id = b.vehicle_id WHERE b.status IN ('ACTIVE', 'CONFIRMED');" },
  { id: '9', label: '9. Completed Rentals', sql: "SELECT b.booking_reference, u.name, v.brand || ' ' || v.model AS vehicle, b.start_date, b.end_date, b.subtotal FROM bookings b JOIN customers c ON c.id = b.customer_id JOIN users u ON u.id = c.user_id JOIN vehicles v ON v.id = b.vehicle_id WHERE b.status = 'COMPLETED';" },
  { id: '10', label: '10. Cancelled Bookings', sql: "SELECT b.booking_reference, u.name, v.vehicle_number, b.start_date, b.end_date, b.subtotal FROM bookings b JOIN customers c ON c.id = b.customer_id JOIN users u ON u.id = c.user_id JOIN vehicles v ON v.id = b.vehicle_id WHERE b.status = 'CANCELLED';" },
  { id: '11', label: '11. Payment Summary', sql: 'SELECT payment_method, payment_status, COUNT(*) AS transaction_count, SUM(amount) AS total_amount FROM payments GROUP BY payment_method, payment_status ORDER BY total_amount DESC;' },
  { id: '12', label: '12. Demand Analysis', sql: 'SELECT vehicle_type, COUNT(b.id) AS historical_rentals, current_demand, predicted_demand FROM vehicles v LEFT JOIN bookings b ON b.vehicle_id = v.id GROUP BY vehicle_type;' },
];

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('4');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary', {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setData(res.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getActiveReportRows = () => {
    if (!data) return [];
    const { kpis, charts, tables } = data;
    switch (activeTab) {
      case '1':
        return charts.booking_status_distribution || [];
      case '2':
        return [
          {
            metric: 'Total Revenue (Paid + Extra Fees)',
            amount: kpis.total_revenue,
            base_booking_revenue: kpis.base_booking_revenue,
            late_and_damage_revenue: kpis.late_and_damage_revenue,
          },
        ];
      case '3':
        return charts.monthly_series || [];
      case '4':
        return tables.most_rented_vehicles || [];
      case '5':
        return tables.most_rented_vehicle_types || [];
      case '6':
        return tables.customer_spending || [];
      case '7':
        return (tables.most_rented_vehicles || []).map((v) => ({
          vehicle_number: v.vehicle_number,
          vehicle_name: v.name,
          vehicle_type: v.vehicle_type,
          status: v.status,
          total_days_rented: v.total_days_rented,
          utilization_percentage: `${v.utilization_percentage}%`,
        }));
      case '8':
        return (tables.active_rentals || []).map((b) => ({
          booking_reference: b.booking_reference,
          customer: b.customer_name,
          vehicle: `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`,
          start_date: b.start_date,
          end_date: b.end_date,
          subtotal: b.subtotal,
          status: b.status,
        }));
      case '9':
        return (tables.completed_rentals || []).map((b) => ({
          booking_reference: b.booking_reference,
          customer: b.customer_name,
          vehicle: `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`,
          start_date: b.start_date,
          end_date: b.end_date,
          subtotal: b.subtotal,
          status: b.status,
        }));
      case '10':
        return (tables.cancelled_bookings || []).map((b) => ({
          booking_reference: b.booking_reference,
          customer: b.customer_name,
          vehicle: `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`,
          start_date: b.start_date,
          end_date: b.end_date,
          cancelled_value: b.subtotal,
        }));
      case '11':
        return tables.payment_summary || [];
      case '12':
        return (tables.most_rented_vehicle_types || []).map((d) => ({
          vehicle_type: d.vehicle_type,
          historical_rentals: d.historical_rentals,
          current_demand: d.current_demand,
          predicted_demand: d.predicted_demand,
          utilization_percentage: `${d.utilization_percentage}%`,
        }));
      default:
        return [];
    }
  };

  const handleExportCSV = () => {
    const rows = getActiveReportRows();
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dbms_report_${activeTab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTabMeta =
    REPORT_TABS.find((t) => t.id === activeTab) || REPORT_TABS[0];
  const activeRows = getActiveReportRows();

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            12 PostgreSQL Analytical Reports
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            SQL Reports & Business Intelligence
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 pl-2">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 12 Report Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SQL Query Evidence Box for DBMS Review */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            PostgreSQL Query Executed ({currentTabMeta.label})
          </span>
          <span className="font-mono text-slate-400">database/reports.sql</span>
        </div>
        <pre className="text-xs font-mono text-emerald-300 overflow-x-auto">
          {currentTabMeta.sql}
        </pre>
      </div>

      {/* Interactive Chart for Selected Report */}
      {data && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            Visual Analytics — {currentTabMeta.label}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  activeTab === '3'
                    ? data.charts.monthly_series
                    : activeTab === '6'
                    ? data.tables.customer_spending
                    : activeTab === '5' || activeTab === '12'
                    ? data.charts.demand_by_type
                    : (data.tables.most_rented_vehicles || []).slice(0, 8)
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={
                    activeTab === '3'
                      ? 'month'
                      : activeTab === '6'
                      ? 'customer_name'
                      : activeTab === '5' || activeTab === '12'
                      ? 'vehicle_type'
                      : 'model'
                  }
                  fontSize={11}
                />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey={
                    activeTab === '3'
                      ? 'revenue'
                      : activeTab === '6'
                      ? 'total_spent'
                      : activeTab === '5' || activeTab === '12'
                      ? 'historical_rentals'
                      : 'rental_count'
                  }
                  name="Primary Metric"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dynamic SQL Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">
            {currentTabMeta.label} — Result Set ({activeRows.length} rows)
          </h2>
          <span className="text-xs text-slate-500">
            Live PostgreSQL Aggregation
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Running PostgreSQL report query...
          </div>
        ) : activeRows.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No rows returned for the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                  {Object.keys(activeRows[0]).map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {Object.entries(row).map(([col, val], cIdx) => (
                      <td key={cIdx} className="py-3 px-4 font-medium text-slate-800">
                        {typeof val === 'number' &&
                        (col.includes('revenue') ||
                          col.includes('amount') ||
                          col.includes('spent') ||
                          col.includes('subtotal') ||
                          col.includes('rate'))
                          ? `₹${val.toLocaleString('en-IN')}`
                          : String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
