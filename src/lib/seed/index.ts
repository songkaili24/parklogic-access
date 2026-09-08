/** Garage snapshot + event seeds. One module per data domain. */
export * from '@/lib/seed/core';
export { generatePermitHolders } from '@/lib/seed/holders';
export { generateSpots } from '@/lib/seed/spots';
export { generateStations, generateSessions, generateTickets } from '@/lib/seed/ev';
export { generateVisitorPasses, generateVisitHistory } from '@/lib/seed/visitors';
export { generateGateEvents } from '@/lib/seed/gates';
export { generateWaitlist } from '@/lib/seed/waitlist';
export { generateInitialEvents, generateInitialAlerts } from '@/lib/seed/activity';
export { generateDevices, rebootCommand } from '@/lib/seed/hardware';
export { generateViolations } from '@/lib/seed/violations';
export { generateInvoices, permitLineItem, invoiceTotal, PERMIT_RATES } from '@/lib/seed/billing';
