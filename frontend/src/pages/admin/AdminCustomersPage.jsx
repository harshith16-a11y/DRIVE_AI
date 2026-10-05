import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    preferred_vehicle_type: 'SUV',
    preferred_transmission: 'Automatic',
    preferred_fuel: 'Petrol',
    preferred_seats: 5,
    budget_per_day: 4000,
    is_active: true,
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search: search.trim() || undefined },
      });
      setCustomers(res.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openEdit = (c) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name,
      phone: c.phone,
      preferred_vehicle_type: c.preferred_vehicle_type || 'SUV',
      preferred_transmission: c.preferred_transmission || 'Automatic',
      preferred_fuel: c.preferred_fuel || 'Petrol',
      preferred_seats: c.preferred_seats || 5,
      budget_per_day: c.budget_per_day || 4000,
      is_active: c.is_active,
    });
    setErr('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setErr('');
    setMsg('');
    try {
      await api.put(`/customers/${editingCustomer.id}`, {
        ...editForm,
        preferred_seats: Number(editForm.preferred_seats),
        budget_per_day: Number(editForm.budget_per_day),
      });
      setMsg(`Customer ${editForm.name} updated successfully.`);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to update customer.');
    }
  };

  const handleDeleteCustomer = async (c) => {
    setErr('');
    setMsg('');
    try {
      const res = await api.delete(`/customers/${c.id}`);
      setMsg(res.data.message);
      await fetchCustomers();
    } catch (error) {
      setErr(error.response?.data?.detail || 'Failed to delete customer.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Customer Directory & CRM
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Customer Management ({customers.length})
        </h1>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, phone, or preferred vehicle type..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Name & Status</th>
                <th className="py-3.5 px-4">Email & Phone</th>
                <th className="py-3.5 px-4">AI Preferences</th>
                <th className="py-3.5 px-4">Bookings</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                    #{c.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{c.email}</div>
                    <div className="text-[11px] text-slate-500">{c.phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="font-semibold text-indigo-600">
                      {c.preferred_vehicle_type}
                    </span>{' '}
                    • {c.preferred_transmission} • {c.preferred_fuel} • ₹
                    {Number(c.budget_per_day).toLocaleString('en-IN')}/d
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.booking_count} ({c.completed_rentals_count} completed)
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                    ₹{Number(c.total_spent).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Rental History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.email} • {selectedCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-500">Total Bookings</div>
                <div className="text-base font-extrabold text-slate-900">
                  {selectedCustomer.booking_count}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-500">Total Spent</div>
                <div className="text-base font-extrabold text-emerald-700">
                  ₹{Number(selectedCustomer.total_spent).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="text-slate-500">Preferred Type</div>
                <div className="text-base font-extrabold text-indigo-600">
                  {selectedCustomer.preferred_vehicle_type}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Completed Rental History (
                {selectedCustomer.rental_history?.length || 0})
              </h4>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 text-xs">
                {(selectedCustomer.rental_history || []).length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">
                    No completed rentals yet.
                  </p>
                ) : (
                  selectedCustomer.rental_history.map((h) => (
                    <div
                      key={h.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {h.vehicle_name} ({h.vehicle_number})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {h.rented_from} → {h.rented_to}
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900">
                        ₹{Number(h.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Edit Customer #{editingCustomer.id}
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Preferred Type
                  </label>
                  <select
                    value={editForm.preferred_vehicle_type}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferred_vehicle_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="SUV">SUV</option>
                    <option value="Electric">Electric</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Daily Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.budget_per_day}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        budget_per_day: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_active: e.target.checked })
                  }
                />
                <span className="font-bold text-slate-700">
                  Account Active
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
