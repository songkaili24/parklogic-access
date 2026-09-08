'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useRealtime } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import {
  IconBadge,
  IconBell,
  IconBolt,
  IconChart,
  IconGrid,
  IconLogs,
  IconParking,
  IconVisitor,
} from '@/components/ui/Icons';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Live Dashboard', Icon: IconGrid },
  { href: '/parking', label: 'Parking Allocations', Icon: IconParking },
  { href: '/visitors', label: 'Visitor Management', Icon: IconVisitor },
  { href: '/ev', label: 'EV Charging Stations', Icon: IconBolt },
  { href: '/permits', label: 'Permit Holders', Icon: IconBadge },
  { href: '/logs', label: 'Access Logs', Icon: IconLogs },
  { href: '/reports', label: 'Reports', Icon: IconChart },
] as const;

function NavLink({ href, label, Icon }: { href: string; label: string; Icon: typeof IconGrid }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-2.5 font-display text-sm tracking-wide transition-colors',
        active
          ? 'bg-control-raised text-signal-green'
          : 'text-slate-400 hover:bg-control-raised/60 hover:text-slate-100',
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-0.5',
          active ? 'bg-signal-green shadow-glow-green' : 'bg-transparent group-hover:bg-slate-600',
        )}
        aria-hidden="true"
      />
      <Icon className="text-lg" />
      {label}
    </Link>
  );
}

/** Nav list shared by the desktop rail and the mobile drawer. */
export function SidebarContent() {
  return (
    <nav className="flex-1 py-3">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <li key={href}>
            <NavLink href={href} label={label} Icon={Icon} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  const { alerts } = useRealtime();
  const unack = alerts.filter((a) => !a.acknowledged).length;

  return (
    <aside
      aria-label="Primary"
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-56 shrink-0 flex-col border-r border-slate-800 bg-control md:flex"
    >
      <SidebarContent />

      <div className="border-t border-slate-800 p-3">
        <a
          href="#alerts"
          className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-control-raised hover:text-slate-100"
        >
          <span className="inline-flex items-center gap-2">
            <IconBell className="text-base" /> Alert Center
          </span>
          {unack > 0 && (
            <span className="font-numeric rounded-full bg-status-occupied px-1.5 text-[11px] font-bold text-white">
              {unack}
            </span>
          )}
        </a>
        <p className="mt-2 px-2 text-[11px] leading-relaxed text-slate-600">
          Gate bus: ANPR lane controllers P1/P2 · EV network: OCPP 2.0.1
        </p>
      </div>
    </aside>
  );
}
