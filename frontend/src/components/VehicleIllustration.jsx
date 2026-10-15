import React, { useState } from 'react';

const TYPE_THEMES = {
  SUV: {
    bg: 'from-slate-950 via-indigo-950 to-slate-900',
    accent: '#6366f1',
    neon: '#38bdf8',
    badge: '4x4 TURBO SUV',
    telemetry: 'AWD TERRAIN • HYDERABAD',
  },
  Electric: {
    bg: 'from-slate-950 via-emerald-950 to-teal-950',
    accent: '#10b981',
    neon: '#34d399',
    badge: 'EV ZERO EMISSION',
    telemetry: 'EV REGEN • FAST CHARGE',
  },
  Luxury: {
    bg: 'from-zinc-950 via-amber-950/80 to-slate-950',
    accent: '#f59e0b',
    neon: '#fbbf24',
    badge: 'LUXURY M-SPORT',
    telemetry: 'TWIN-TURBO • EXECUTIVE',
  },
  Sedan: {
    bg: 'from-slate-950 via-blue-950 to-slate-900',
    accent: '#3b82f6',
    neon: '#60a5fa',
    badge: 'EXECUTIVE SEDAN',
    telemetry: 'ADAS L2 • HYDERABAD',
  },
  Hatchback: {
    bg: 'from-slate-950 via-purple-950 to-indigo-950',
    accent: '#a855f7',
    neon: '#c084fc',
    badge: 'N-LINE HOT HATCH',
    telemetry: 'AGILE CITY • HYDERABAD',
  },
};

const MODEL_PHOTOS = {
  creta: '/vehicles/creta.jpg',
  nexon: '/vehicles/nexon-ev.jpg',
  xuv700: '/vehicles/xuv700.jpg',
  city: '/vehicles/city.jpg',
  baleno: '/vehicles/baleno.jpg',
  bmw: '/vehicles/bmw3.jpg',
  virtus: '/vehicles/virtus.jpg',
  'zs ev': '/vehicles/mg-zsev.jpg',
  zs: '/vehicles/mg-zsev.jpg',
  hycross: '/vehicles/hycross.jpg',
  innova: '/vehicles/hycross.jpg',
  i20: '/vehicles/i20.jpg',
  mercedes: '/vehicles/mercc.jpg',
  'c-class': '/vehicles/mercc.jpg',
  seltos: '/vehicles/seltos.jpg',
};

function resolveVehiclePhoto(vehicle) {
  if (vehicle?.image_url && vehicle.image_url.startsWith('/vehicles/')) {
    return vehicle.image_url;
  }
  const name = `${vehicle?.brand || ''} ${vehicle?.model || ''}`.toLowerCase();
  for (const [key, photo] of Object.entries(MODEL_PHOTOS)) {
    if (name.includes(key)) {
      return photo;
    }
  }
  if (vehicle?.vehicle_type === 'SUV') return '/vehicles/creta.jpg';
  if (vehicle?.vehicle_type === 'Electric') return '/vehicles/nexon-ev.jpg';
  if (vehicle?.vehicle_type === 'Luxury') return '/vehicles/bmw3.jpg';
  if (vehicle?.vehicle_type === 'Sedan') return '/vehicles/virtus.jpg';
  if (vehicle?.vehicle_type === 'Hatchback') return '/vehicles/baleno.jpg';
  return '/vehicles/creta.jpg';
}

export default function VehicleIllustration({
  vehicle,
  className = 'h-48 w-full',
  showOverlay = true,
}) {
  const [imageError, setImageError] = useState(false);
  const type = vehicle?.vehicle_type || 'SUV';
  const theme = TYPE_THEMES[type] || TYPE_THEMES.SUV;
  const brand = vehicle?.brand || 'Premium';
  const model = vehicle?.model || 'Vehicle';
  const photoUrl = resolveVehiclePhoto(vehicle);

  return (
    <div
      className={`group relative overflow-hidden bg-slate-950 flex flex-col justify-between select-none ${className}`}
    >
      {/* Real Showroom Car Photo */}
      {!imageError && photoUrl ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src={photoUrl}
            alt={`${brand} ${model}`}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Subtle Top & Bottom Gradient Vignette for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/60 pointer-events-none" />
        </div>
      ) : (
        /* Fallback Clean Slate Backdrop with Ambient Glow */
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`}>
          <div
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-72 rounded-full blur-2xl opacity-40"
            style={{ backgroundColor: theme.accent }}
          />
        </div>
      )}

      {/* Top Telemetry & Badge Pill */}
      <div className="relative z-10 flex items-center justify-between p-3.5">
        <span
          className="px-2.5 py-0.8 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md backdrop-blur-md"
          style={{
            backgroundColor: `${theme.accent}cc`,
            border: `1px solid ${theme.neon}66`,
          }}
        >
          {theme.badge}
        </span>

        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-200/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
          {theme.telemetry}
        </span>
      </div>

      {/* Bottom Brand & Registration Plate Bar */}
      {showOverlay && (
        <div className="relative z-10 flex items-center justify-between p-3.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <span className="font-extrabold tracking-wide text-white text-xs drop-shadow-md">
            {brand}{' '}
            <span className="text-white/80 font-medium">{model}</span>
          </span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/20 backdrop-blur-sm">
            {vehicle?.vehicle_number || 'HYD FLEET'}
          </span>
        </div>
      )}
    </div>
  );
}
