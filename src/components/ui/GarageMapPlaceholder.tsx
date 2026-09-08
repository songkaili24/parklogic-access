'use client';

import { cn } from '@/lib/utils';

export interface GarageMapLevel {
  id: string;
  label: string;
  total: number;
  available: number;
}

export interface GarageMapZone {
  name: string;
  label: string;
  total: number;
  available: number;
}

export interface GarageMapPlaceholderProps {
  levels: GarageMapLevel[];
  activeLevel?: string;
  onSelectLevel?: (levelId: string) => void;
  /** Zone breakdown for the active level, drawn as the schematic. */
  zones: GarageMapZone[];
  className?: string;
}

function ZoneBar({ zone }: { zone: GarageMapZone }) {
  const fill = zone.total > 0 ? (zone.total - zone.available) / zone.total : 0;
  const width = Math.max(4, Math.round(fill * 100));

  return (
    <g>
      <text x={0} y={14} className="fill-slate-400 font-sans text-[10px]">
        {zone.label}
      </text>
      <rect
        x={70}
        y={4}
        width={300}
        height={12}
        rx={2}
        className="fill-slate-800 stroke-slate-700"
      />
      <rect x={70} y={4} width={width * 3} height={12} rx={2} className="fill-status-reserved/70" />
      <text x={380} y={14} className="fill-slate-400 font-sans text-[10px]">
        {zone.available}/{zone.total} free
      </text>
    </g>
  );
}

/**
 * Schematic overview of a garage level. Intentionally a placeholder for a
 * future camera/LiDAR overlay — the data contract (levels + zone counts)
 * matches what such an integration would provide.
 */
export function GarageMapPlaceholder({
  levels,
  activeLevel,
  onSelectLevel,
  zones,
  className,
}: GarageMapPlaceholderProps) {
  const active = levels.find((level) => level.id === activeLevel) ?? levels[0];

  return (
    <div
      className={cn('rounded border border-slate-700/70 bg-control-raised shadow-panel', className)}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
          Garage Level View
        </h3>
        <nav aria-label="Select garage level" className="flex gap-1">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-current={level.id === active?.id ? 'true' : undefined}
              onClick={() => onSelectLevel?.(level.id)}
              className={cn(
                'rounded px-2.5 py-1 font-display text-xs tracking-widest transition-colors',
                level.id === active?.id
                  ? 'bg-signal-green/15 text-signal-green'
                  : 'text-slate-400 hover:bg-control-overlay hover:text-slate-200',
              )}
            >
              {level.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-blueprint p-4">
        <svg
          viewBox={`0 0 460 ${zones.length * 22 + 40}`}
          role="img"
          aria-label={`Schematic of ${active?.label ?? 'garage level'}`}
          className="h-auto w-full"
        >
          {/* Structure: perimeter, ramp, elevator core */}
          <rect
            x={0}
            y={0}
            width={460}
            height={zones.length * 22 + 40}
            rx={4}
            className="fill-none stroke-slate-600"
          />
          <path d="M 420 8 L 452 8 L 452 60 Z" className="fill-slate-800 stroke-slate-600" />
          <text x={418} y={74} textAnchor="end" className="fill-slate-500 font-sans text-[9px]">
            RAMP
          </text>
          <rect
            x={8}
            y={zones.length * 22 + 12}
            width={36}
            height={20}
            className="fill-slate-800 stroke-slate-600"
          />
          <text
            x={26}
            y={zones.length * 22 + 26}
            textAnchor="middle"
            className="fill-slate-500 font-sans text-[9px]"
          >
            ELEV
          </text>

          {zones.map((zone, index) => (
            <g key={zone.name} transform={`translate(0 ${index * 22 + 8})`}>
              <ZoneBar zone={zone} />
            </g>
          ))}
        </svg>

        <p className="mt-2 text-[11px] text-slate-500">
          Schematic preview — live camera and bay-sensor overlay integration pending.
        </p>
      </div>
    </div>
  );
}
