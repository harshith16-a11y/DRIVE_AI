import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Fuel,
  Gauge,
  MapPin,
  Sparkles,
  CalendarCheck,
  Eye,
  Wrench,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import VehicleIllustration from './VehicleIllustration';

const STATUS_BADGE = {
  AVAILABLE: 'bg-emerald-500/95 text-white border-emerald-400',
  BOOKED: 'bg-amber-500/95 text-white border-amber-400',
  RENTED: 'bg-blue-600/95 text-white border-blue-400',
  MAINTENANCE: 'bg-rose-600/95 text-white border-rose-400',
  INACTIVE: 'bg-slate-600/95 text-white border-slate-400',
};

export default function VehicleCard({
  vehicle,
  aiScore = null,
  aiReason = null,
  matchingFactors = [],
}) {
  const statusStyle =
    STATUS_BADGE[vehicle.status] || STATUS_BADGE.AVAILABLE;

  const coveredKms = vehicle.covered_kms || 14200;
  const conditionBadge = vehicle.condition_badge || 'Excellent (Good)';
  const healthPct = vehicle.overall_health_pct || 98;
  const lastService = vehicle.last_service_date || '2026-08-25';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top Visual Banner */}
      <div className="relative">
        <VehicleIllustration vehicle={vehicle} className="h-48 w-full" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {aiScore !== null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg border border-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              {Math.round(aiScore)}% AI Match
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow ${statusStyle}`}
          >
            {vehicle.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                {vehicle.brand} • {vehicle.vehicle_type}
              </p>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {vehicle.brand} {vehicle.model}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-extrabold text-slate-900">
                ₹{Number(vehicle.daily_rate).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                per day
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vehicle.location}</span>
          </div>

          {/* Primary Specs Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
              <Gauge className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate font-medium">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
              <Fuel className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate font-medium">{vehicle.fuel_type}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
              <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate font-medium">{vehicle.seats} Seats</span>
            </div>
          </div>

          {/* Odometer (Covered KMs), Condition & Maintenance Pill Row */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-semibold">
              <Navigation className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">
                {Number(coveredKms).toLocaleString('en-IN')} km
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate" title={conditionBadge}>
                {healthPct}% Health
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-900 font-semibold">
              <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate" title={`Last Service: ${lastService}`}>
                {lastService}
              </span>
            </div>
          </div>

          {/* Explainable AI Recommendation Box if provided */}
          {aiReason && (
            <div className="mt-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <div className="flex items-start gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{aiReason}</p>
              </div>
              {matchingFactors && matchingFactors.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {matchingFactors.map((factor, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
          <Link
            to={`/vehicles/${vehicle.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Link>
          <Link
            to={`/vehicles/${vehicle.id}?book=true`}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              vehicle.status === 'MAINTENANCE' || vehicle.status === 'INACTIVE'
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
