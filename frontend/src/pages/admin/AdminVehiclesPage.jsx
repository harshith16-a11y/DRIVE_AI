import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../../services/api';
import VehicleIllustration from '../../components/VehicleIllustration';

const INITIAL_FORM = {
  vehicle_number: '',
  brand: '',
  model: '',
  vehicle_type: 'SUV',
  year: 2024,
  transmission: 'Automatic',
  fuel_type: 'Petrol',
  seats: 5,
  color: 'Metallic Grey',
  daily_rate: 3500,
  status: 'AVAILABLE',
  location: 'Hyderabad - HITEC City Hub',
  image_url:
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=85',
  description:
    'Well-maintained connected fleet vehicle with full safety package and climate control.',
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      setVehicles(res.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingId(v.id);
    setForm({
      vehicle_number: v.vehicle_number,
      brand: v.brand,
      model: v.model,
      vehicle_type: v.vehicle_type,
      year: v.year,
      transmission: v.transmission,
      fuel_type: v.fuel_type,
      seats: v.seats,
      color: v.color,
      daily_rate: v.daily_rate,
      status: v.status,
      location: v.location,
      image_url: v.image_url,
      description: v.description,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        seats: Number(form.seats),
        daily_rate: Number(form.daily_rate),
      };
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        setSuccessMsg(`Vehicle ${form.vehicle_number} updated successfully.`);
      } else {
        await api.post('/vehicles', payload);
        setSuccessMsg(`Vehicle ${form.vehicle_number} added to PostgreSQL fleet.`);
      }
      setModalOpen(false);
      await fetchVehicles();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to save vehicle record.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (v) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/vehicles/${v.id}`);
      setSuccessMsg(res.data.message);
      await fetchVehicles();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Could not delete vehicle.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Fleet Inventory CRUD
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Vehicle Management ({vehicles.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && !modalOpen && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle number, brand, model, or hub..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="BOOKED">BOOKED</option>
          <option value="RENTED">RENTED</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Preview</th>
                <th className="py-3.5 px-4">Vehicle No.</th>
                <th className="py-3.5 px-4">Brand & Model</th>
                <th className="py-3.5 px-4">Type & Specs</th>
                <th className="py-3.5 px-4">Daily Rate</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">CRUD Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 w-28">
                    <div className="w-24 h-14 rounded-xl overflow-hidden">
                      <VehicleIllustration
                        vehicle={v}
                        className="w-full h-full"
                        showOverlay={false}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    {v.vehicle_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {v.brand} {v.model}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {v.year} • {v.color}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {v.vehicle_type}
                    </span>{' '}
                    • {v.transmission} • {v.fuel_type} • {v.seats} Seats
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    ₹{Number(v.daily_rate).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{v.location}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        v.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'BOOKED'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'RENTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Vehicle Number (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.vehicle_number}
                    onChange={(e) =>
                      setForm({ ...form, vehicle_number: e.target.value })
                    }
                    placeholder="KA-01-AB-1234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    placeholder="Hyundai / Tata / BMW"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    required
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                    placeholder="Creta SX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) =>
                      setForm({ ...form, vehicle_type: e.target.value })
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
                    Transmission
                  </label>
                  <select
                    value={form.transmission}
                    onChange={(e) =>
                      setForm({ ...form, transmission: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) =>
                      setForm({ ...form, fuel_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    required
                    min={2010}
                    max={2030}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={15}
                    value={form.seats}
                    onChange={(e) =>
                      setForm({ ...form, seats: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    required
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={form.daily_rate}
                    onChange={(e) =>
                      setForm({ ...form, daily_rate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="RENTED">RENTED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Hub Location
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                    ? 'Update Vehicle'
                    : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
