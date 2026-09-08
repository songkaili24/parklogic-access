/** Garage snapshot + event seeds. One module per data domain. */
export * from '@/lib/seed/core';
export { generatePermitHolders } from '@/lib/seed/holders';
export { generateSpots } from '@/lib/seed/spots';
export { generateStations, generateSessions, generateTickets } from '@/lib/seed/ev';
export { generateVisitorPasses, generateVisitHistory } from '@/lib/seed/visitors';
