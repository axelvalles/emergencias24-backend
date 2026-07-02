import { ServiceType } from './entities/ticket.entity';
import {
  TicketRoutingPolicy,
  TICKET_OWNER_ROLE,
} from './ticket-routing.policy';

describe('TicketRoutingPolicy', () => {
  it('routes imaging and laboratory tickets to appointment managers', () => {
    const policy = new TicketRoutingPolicy();

    expect(policy.resolveOwnerRole(ServiceType.IMAGING)).toBe(
      TICKET_OWNER_ROLE.APPOINTMENT_MANAGER,
    );
    expect(policy.resolveOwnerRole(ServiceType.LABORATORY)).toBe(
      TICKET_OWNER_ROLE.APPOINTMENT_MANAGER,
    );
  });

  it('keeps appointment and equipment rental unrouted', () => {
    const policy = new TicketRoutingPolicy();

    expect(policy.resolveOwnerRole(ServiceType.APPOINTMENT)).toBeNull();
    expect(policy.resolveOwnerRole(ServiceType.EQUIPMENT_RENTAL)).toBeNull();
  });

  it('keeps paramedic and doctor service types on their approved owner roles', () => {
    const policy = new TicketRoutingPolicy();

    expect(policy.resolveOwnerRole(ServiceType.STUDY_TRANSFER)).toBe(
      TICKET_OWNER_ROLE.PARAMEDIC,
    );
    expect(policy.resolveOwnerRole(ServiceType.MEDICAL_CONSULTATION)).toBe(
      TICKET_OWNER_ROLE.DOCTOR,
    );
  });
});
