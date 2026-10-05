import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import VehicleCard from '../../components/VehicleCard';

export default function VehicleListing() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [vehicleType, setVehicleType] = useState(
    searchParams.get('vehicle_type') || 'ALL'
  );
  const [transmission, setTransmission] = useState(
    searchParams.get('transmission') || 'ALL'
  );
  const [fuelType, setFuelType] = useState(
    searchParams.get('fuel_type') || 'ALL'
  );
  const [seats, setSeats] = useState(searchParams.get('seats') || 'ALL');
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('max_price') || ''
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'ALL'
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (vehicleType !== 'ALL') params.vehicle_type = vehicleType;
      if (transmission !== 'ALL') params.transmission = transmission;
      if (fuelType !== 'ALL') params.fuel_type = fuelType;
      if (seats !== 'ALL') params.seats = Number(seats);
      if (maxPrice) params.max_price = Number(maxPrice);
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const res = await api.get('/vehicles', { params });
      setVehicles(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to load vehicles from database.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    vehicleType,
    transmission,
    fuelType,
    seats,
    maxPrice,
    statusFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const resetFilters = () => {
    setSearch('');
    setVehicleType('ALL');
    setTransmission('ALL');
    setFuelType('ALL');
    setSeats('ALL');
    setMaxPrice('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  const applyDemoSuvFilter = () => {
    setVehicleType('SUV');
    setTransmission('Automatic');
    setMaxPrice('4500');
    setStatusFilter('AVAILABLE');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            PostgreSQL Live Inventory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Explore Rental Fleet ({vehicles.length} Vehicles)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyDemoSuvFilter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Filter: SUV • Automatic • ≤ ₹4,500</span>
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Multi-Criteria Filter Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Brand, Model, Location
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Creta, Nexon, BMW, Airport..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Vehicle Type
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="SUV">SUV</option>
              <option value="Electric">Electric</option>
              <option value="Sedan">Sedan</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Transmission
            </label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="ALL">All</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fuel Type
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="ALL">All Fuels</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Max Daily Price */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Max Price (₹/Day)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 4500"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Second Filter Row: Seats, Status, and Date Range Availability Check */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Minimum Seats
            </label>
            <select
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="ALL">Any Capacity</option>
              <option value="5">5+ Seats</option>
              <option value="7">7 Seats</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Availability Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE Only</option>
              <option value="BOOKED">BOOKED</option>
              <option value="RENTED">RENTED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Available From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Available To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            No vehicles match your selected filters
          </h3>
          <p className="text-xs text-slate-500">
            Try widening your daily budget or resetting the filter criteria.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
