'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { IconGate } from '@/components/ui/Icons';

import { NAV_ITEMS } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

/** Bottom tab bar for the operations-on-the-floor mobile experience. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-800 bg-control/95 backdrop-blur md:hidden"
    >
      {NAV_ITEMS.slice(0, 4).map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 font-display text-[10px] uppercase tracking-wider',
              active ? 'text-signal-green' : 'text-slate-500',
            )}
          >
            <Icon className="text-lg" />
            <span className="max-w-full truncate px-1">{label.split(' ')[0]}</span>
          </Link>
        );
      })}
      <Link
        href="/logs"
        aria-current={pathname === '/logs' || pathname === '/reports' ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-0.5 py-2 font-display text-[10px] uppercase tracking-wider',
          pathname === '/logs' || pathname === '/reports' ? 'text-signal-green' : 'text-slate-500',
        )}
      >
        <IconGate className="text-lg" />
        <span>Logs</span>
      </Link>
    </nav>
  );
}
