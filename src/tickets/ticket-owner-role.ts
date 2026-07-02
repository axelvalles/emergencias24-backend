export const TICKET_OWNER_ROLE = {
  PARAMEDIC: 'paramedic',
  DOCTOR: 'doctor',
  APPOINTMENT_MANAGER: 'appointment_manager',
  MARKETING: 'marketing',
  DISPATCHER: 'dispatcher',
  EMERGENCY_ROOM: 'emergency_room',
} as const;

export type TicketOwnerRole =
  (typeof TICKET_OWNER_ROLE)[keyof typeof TICKET_OWNER_ROLE];
