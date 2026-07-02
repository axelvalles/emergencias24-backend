import { Injectable } from '@nestjs/common';
import { ServiceType } from './entities/ticket.entity';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from './ticket-owner-role';

const OWNER_ROLE_BY_SERVICE_TYPE: Partial<
  Record<ServiceType, TicketOwnerRole>
> = {
  [ServiceType.IMMEDIATE_ATTENTION]: TICKET_OWNER_ROLE.PARAMEDIC,
  [ServiceType.AMBULANCE]: TICKET_OWNER_ROLE.PARAMEDIC,
  [ServiceType.HOME_CARE]: TICKET_OWNER_ROLE.PARAMEDIC,
  [ServiceType.STUDY_TRANSFER]: TICKET_OWNER_ROLE.PARAMEDIC,
  [ServiceType.TELEMEDICINE]: TICKET_OWNER_ROLE.DOCTOR,
  [ServiceType.MEDICAL_CONSULTATION]: TICKET_OWNER_ROLE.DOCTOR,
  [ServiceType.LABORATORY]: TICKET_OWNER_ROLE.APPOINTMENT_MANAGER,
  [ServiceType.IMAGING]: TICKET_OWNER_ROLE.APPOINTMENT_MANAGER,
  [ServiceType.PLANS]: TICKET_OWNER_ROLE.MARKETING,
};

@Injectable()
export class TicketRoutingPolicy {
  resolveOwnerRole(serviceType: ServiceType): TicketOwnerRole | null {
    return OWNER_ROLE_BY_SERVICE_TYPE[serviceType] ?? null;
  }
}

export { TICKET_OWNER_ROLE } from './ticket-owner-role';
export type { TicketOwnerRole } from './ticket-owner-role';
