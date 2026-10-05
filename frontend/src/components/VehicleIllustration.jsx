import React, { useId } from 'react';

const TYPE_THEMES = {
  SUV: {
    bg: 'from-slate-950 via-indigo-950 to-slate-900',
    accent: '#6366f1',
    neon: '#38bdf8',
    badge: '4x4 TURBO SUV',
    telemetry: 'AWD TERRAIN • 108 KM/H',
  },
  Electric: {
    bg: 'from-slate-950 via-emerald-950 to-teal-950',
    accent: '#10b981',
    neon: '#34d399',
    badge: 'EV ZERO EMISSION',
    telemetry: 'EV REGEN • 98% SOC',
  },
  Luxury: {
    bg: 'from-zinc-950 via-amber-950/80 to-slate-950',
    accent: '#f59e0b',
    neon: '#fbbf24',
    badge: 'LUXURY M-SPORT',
    telemetry: 'BI-TURBO • SPORT+',
  },
  Sedan: {
    bg: 'from-slate-950 via-blue-950 to-slate-900',
    accent: '#3b82f6',
    neon: '#60a5fa',
    badge: 'EXECUTIVE SEDAN',
    telemetry: 'ADAS L2 • CRUISE',
  },
  Hatchback: {
    bg: 'from-slate-950 via-purple-950 to-indigo-950',
    accent: '#a855f7',
    neon: '#c084fc',
    badge: 'N-LINE HOT HATCH',
    telemetry: 'DCT BOOST • AGILE',
  },
};

// Matches real vehicle color names from PostgreSQL to metallic 3-stop gradients
const PAINT_PALETTE = {
  'Titan Grey': ['#94a3b8', '#475569', '#1e293b'],
  'Empowered Oxide': ['#5eead4', '#0d9488', '#115e59'],
  'Midnight Black': ['#475569', '#1e293b', '#090d16'],
  'Obsidian Blue': ['#60a5fa', '#1d4ed8', '#172554'],
  'Nexa Blue': ['#38bdf8', '#0284c7', '#0c4a6e'],
  'Mineral White': ['#f8fafc', '#cbd5e1', '#64748b'],
  'Pearl White': ['#ffffff', '#e2e8f0', '#94a3b8'],
  'Wild Cherry Red': ['#fb7185', '#e11d48', '#881337'],
  'Glaze Red': ['#f87171', '#dc2626', '#7f1d1d'],
  'Thunder Blue': ['#818cf8', '#4f46e5', '#1e1b4b'],
  'Selenite Grey': ['#cbd5e1', '#64748b', '#334155'],
  'Pewter Olive': ['#a3e635', '#4d7c0f', '#1a2e05'],
};

function getPaintStops(colorName, fallbackAccent) {
  if (colorName && PAINT_PALETTE[colorName]) {
    return PAINT_PALETTE[colorName];
  }
  return ['#60a5fa', fallbackAccent, '#1e293b'];
}

function AnimatedWheel({ cx, cy, r = 21, caliperColor = '#ef4444' }) {
  return (
    <g>
      {/* Outer Rubber Tire with tread shadow */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#090d16"
        stroke="#334155"
        strokeWidth="3.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r - 3.5}
        fill="none"
        stroke="#475569"
        strokeWidth="1"
        strokeDasharray="6 4"
      />

      {/* Glowing Ventilated Brake Disc & Brembo Caliper */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 6}
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      <path
        d={`M ${cx - 11} ${cy - 8} A 11 11 0 0 1 ${cx - 4} ${cy - 13}`}
        stroke={caliperColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Spinning Diamond-Cut Multi-Spoke Alloy Rim */}
      <g className="car-wheel-spin">
        <circle
          cx={cx}
          cy={cy}
          r={r - 5}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle} ${cx} ${cy})`}>
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (r - 5.5)}
              stroke="#f8fafc"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <line
              x1={cx + 2}
              y1={cy - 4}
              x2={cx + 5}
              y2={cy - (r - 6)}
              stroke="#94a3b8"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Center Hub Cap */}
        <circle cx={cx} cy={cy} r="4.5" fill="#0f172a" stroke="#f8fafc" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="1.8" fill={caliperColor} />
      </g>
    </g>
  );
}

export default function VehicleIllustration({
  vehicle,
  className = 'h-48 w-full',
  showOverlay = true,
}) {
  const uid = useId().replace(/:/g, '');
  const type = vehicle?.vehicle_type || 'SUV';
  const theme = TYPE_THEMES[type] || TYPE_THEMES.SUV;
  const brand = vehicle?.brand || 'Premium';
  const model = vehicle?.model || 'Vehicle';
  const year = vehicle?.year || 2024;
  const colorName = vehicle?.color || 'Titan Grey';

  const [paintLight, paintMid, paintDark] = getPaintStops(
    colorName,
    theme.accent
  );

  const bodyGradId = `bodyGrad-${uid}`;
  const glassGradId = `glassGrad-${uid}`;
  const beamGradId = `beamGrad-${uid}`;
  const roadGradId = `roadGrad-${uid}`;

  const isSUV = type === 'SUV' || type === 'Electric';
  const isHatch = type === 'Hatchback';

  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} flex flex-col justify-between p-4 select-none ${className}`}
    >
      {/* Ambient Showroom & Neon Highway Glow */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-36 w-72 rounded-full blur-2xl opacity-35"
        style={{ backgroundColor: theme.accent }}
      />
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 h-10 w-4/5 rounded-full blur-xl opacity-40"
        style={{ backgroundColor: theme.neon }}
      />

      {/* Top Metadata & Live Telemetry Bar */}
      {showOverlay && (
        <div className="relative z-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-white/10 text-white backdrop-blur-sm border border-white/20 text-[10px]">
              {theme.badge}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {theme.telemetry}
            </span>
          </div>
          <span className="text-white/80 font-mono text-[11px] font-semibold">
            {year} • {colorName}
          </span>
        </div>
      )}

      {/* Animated Modern Car SVG Scene */}
      <div className="relative z-10 my-auto flex items-center justify-center py-1">
        <svg
          viewBox="0 0 380 138"
          className="w-full max-w-[330px] drop-shadow-[0_14px_20px_rgba(0,0,0,0.75)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 3D Metallic Automotive Paint Gradient */}
            <linearGradient
              id={bodyGradId}
              x1="40"
              y1="18"
              x2="330"
              y2="108"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={paintLight} />
              <stop offset="48%" stopColor={paintMid} />
              <stop offset="100%" stopColor={paintDark} />
            </linearGradient>

            {/* Tinted Panoramic Cabin Glass Gradient */}
            <linearGradient
              id={glassGradId}
              x1="100"
              y1="20"
              x2="260"
              y2="55"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Matrix LED Headlight Cone Gradient */}
            <linearGradient
              id={beamGradId}
              x1="50"
              y1="72"
              x2="0"
              y2="82"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            {/* Neon Road Reflection Gradient */}
            <linearGradient
              id={roadGradId}
              x1="20"
              y1="120"
              x2="360"
              y2="120"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={theme.neon} stopOpacity="0" />
              <stop offset="50%" stopColor={theme.neon} stopOpacity="0.7" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Passing Smart-Highway Light Pillars in Background */}
          <g className="car-city-pillar">
            <rect x="40" y="12" width="2" height="95" fill="rgba(255,255,255,0.12)" />
            <circle cx="41" cy="14" r="4" fill={theme.neon} opacity="0.45" />
          </g>
          <g className="car-city-pillar-delayed">
            <rect x="40" y="20" width="1.5" height="87" fill="rgba(255,255,255,0.08)" />
            <circle cx="40.7" cy="22" r="3" fill="#fef08a" opacity="0.35" />
          </g>

          {/* Aerodynamic Wind Streamlines over Car */}
          <path
            d="M 18 52 Q 95 14 210 12 T 365 42"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
            className="car-aero-stream"
          />
          <path
            d="M 30 34 Q 130 4 255 10 T 372 30"
            stroke={theme.neon}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            className="car-aero-stream"
          />

          {/* Ground Shadow & Scrolling Highway Lane Lines */}
          <ellipse cx="190" cy="116" rx="148" ry="8" fill="rgba(0,0,0,0.65)" />
          <line
            x1="10"
            y1="121"
            x2="370"
            y2="121"
            stroke={`url(#${roadGradId})`}
            strokeWidth="2"
          />
          <line
            x1="0"
            y1="126"
            x2="380"
            y2="126"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.2"
            strokeDasharray="22 14"
            className="car-road-scroll"
          />

          {/* Floating / Bouncing Car Chassis & Body Group */}
          <g className="car-chassis-bounce">
            {/* Volumetric Matrix LED Headlight Beam (Left/Front) */}
            <polygon
              points="44,64 0,46 0,94 46,78"
              fill={`url(#${beamGradId})`}
              className="car-headlight-beam"
            />

            {/* Neon Taillight Speed Trail (Right/Rear) */}
            <line
              x1="334"
              y1="62"
              x2="376"
              y2="62"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
              className="car-headlight-beam"
            />
            <line
              x1="336"
              y1="67"
              x2="366"
              y2="67"
              stroke="#f97316"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />

            {isSUV ? (
              <>
                {/* MODERN SCULPTED SUV / EV CROSSOVER BODY */}
                {/* Roof Rack & Shark Fin Antenna */}
                <path
                  d="M134 15 L268 15"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon points="262,16 273,9 277,16" fill={paintDark} />

                {/* Main Metallic SUV Body Shell */}
                <path
                  d="M36 84 L46 56 C52 46 66 42 86 40 L126 19 C136 15 150 14 170 14 L272 15 C288 15 300 22 310 37 L330 52 C338 56 342 66 342 80 L340 95 C339 99 334 101 325 101 L45 101 C38 101 34 94 36 84 Z"
                  fill={`url(#${bodyGradId})`}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1.5"
                />

                {/* Black Cladding & Lower Sport Splitter */}
                <path
                  d="M37 92 L340 92 L338 101 L42 101 Z"
                  fill="#0f172a"
                />
                {/* Panoramic Tinted Glasshouse */}
                <path
                  d="M96 44 L132 22 C140 19 152 18 175 18 L175 45 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
                <path
                  d="M182 18 L244 18 L244 45 L182 45 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
                <path
                  d="M251 18 L278 19 L298 45 L251 45 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
              </>
            ) : isHatch ? (
              <>
                {/* SPORTY HOT HATCHBACK (N-LINE / BALENO) */}
                {/* Rear Roof Spoiler */}
                <path
                  d="M282 20 L306 14 L309 22 L286 26 Z"
                  fill="#0f172a"
                  stroke={theme.neon}
                  strokeWidth="1"
                />
                <path
                  d="M40 86 L52 60 C60 51 78 46 104 43 L144 21 C156 16 174 15 198 15 L278 18 C294 19 306 29 318 48 L332 64 C337 72 338 82 336 94 C335 99 329 101 320 101 L46 101 C39 101 36 94 40 86 Z"
                  fill={`url(#${bodyGradId})`}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1.5"
                />
                {/* Hot Hatch Cabin Windows */}
                <path
                  d="M112 44 L148 23 L204 22 L204 45 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
                <path
                  d="M211 22 L274 24 L296 45 L211 45 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1"
                />
              </>
            ) : (
              <>
                {/* LOW-SLUNG LUXURY FASTBACK SEDAN / GRAN LIMOUSINE */}
                {/* Subtle Carbon Ducktail Spoiler */}
                <path
                  d="M322 48 L338 43 L340 49 L326 52 Z"
                  fill="#0f172a"
                />
                <path
                  d="M32 87 L48 61 C58 52 80 47 108 45 L150 22 C164 17 182 15 206 16 L264 18 C284 20 302 31 318 47 L338 56 C344 61 347 72 346 86 L344 95 C342 99 336 101 326 101 L42 101 C35 101 30 95 32 87 Z"
                  fill={`url(#${bodyGradId})`}
                  stroke="rgba(255,255,255,0.48)"
                  strokeWidth="1.5"
                />
                {/* Sleek Coupe Windows with Chrome Hofmeister Kink */}
                <path
                  d="M116 45 L154 24 L208 23 L208 46 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.1"
                />
                <path
                  d="M215 23 L266 25 L298 46 L215 46 Z"
                  fill={`url(#${glassGradId})`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.1"
                />
              </>
            )}

            {/* Side Wing Mirror with LED Turn Indicator */}
            <path
              d="M112 42 L123 39 L125 46 L114 48 Z"
              fill={paintDark}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
            />
            <line
              x1="114"
              y1="44"
              x2="121"
              y2="43"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />

            {/* Flush Illuminating Door Handles & Sculpted Waistline */}
            <path
              d="M72 64 L308 60"
              stroke="rgba(255,255,255,0.38)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect
              x="156"
              y="54"
              width="14"
              height="3"
              rx="1.5"
              fill="rgba(255,255,255,0.75)"
            />
            <rect
              x="224"
              y="53"
              width="14"
              height="3"
              rx="1.5"
              fill="rgba(255,255,255,0.75)"
            />

            {/*Lower Side Skirt Aero Blade */}
            <path
              d="M132 94 L244 94"
              stroke={theme.neon}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Front Matrix LED Headlight & DRL Signature */}
            <path
              d="M39 66 L64 60 L60 72 L38 75 Z"
              fill="#fef08a"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <polyline
              points="40,74 58,71 63,62"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
            />

            {/* Rear 3D LED Taillight Bar */}
            <path
              d="M328 56 L341 59 L341 72 L326 69 Z"
              fill="#ef4444"
              stroke="#fca5a5"
              strokeWidth="1"
            />

            {/* Muscular Wheel Arch Flares */}
            <path
              d="M72 99 A 28 28 0 0 1 132 99"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2.5"
              fill="#090d16"
            />
            <path
              d="M248 99 A 28 28 0 0 1 308 99"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2.5"
              fill="#090d16"
            />
          </g>

          {/* Front & Rear Animated Spinning Alloy Wheels */}
          <AnimatedWheel
            cx={102}
            cy={98}
            r={22}
            caliperColor={type === 'Electric' ? '#10b981' : '#ef4444'}
          />
          <AnimatedWheel
            cx={278}
            cy={98}
            r={22}
            caliperColor={type === 'Electric' ? '#10b981' : '#ef4444'}
          />
        </svg>
      </div>

      {/* Bottom Brand & Registration Plate Bar */}
      {showOverlay && (
        <div className="relative z-10 flex items-center justify-between text-xs text-white/90">
          <span className="font-bold tracking-wide">
            {brand}{' '}
            <span className="text-white/70 font-medium">{model}</span>
          </span>
          <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded bg-black/45 text-white border border-white/15">
            {vehicle?.vehicle_number || 'FLEET'}
          </span>
        </div>
      )}
    </div>
  );
}
