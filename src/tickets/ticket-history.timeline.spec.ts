import { TicketStatus } from './entities/ticket.entity';
import { buildTicketHistoryTimeline } from './ticket-history.timeline';
import { TICKET_OWNER_ROLE } from './ticket-owner-role';

describe('buildTicketHistoryTimeline', () => {
  it('orders status and handoff events by creation time', () => {
    const timeline = buildTicketHistoryTimeline({
      statusHistory: [
        {
          id: 'status-1',
          status: TicketStatus.PENDING,
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
        {
          id: 'status-2',
          status: TicketStatus.ASSIGNED,
          createdAt: new Date('2026-01-01T10:15:00.000Z'),
        },
      ],
      handoffs: [
        {
          id: 'handoff-1',
          fromOwnerRole: TICKET_OWNER_ROLE.DISPATCHER,
          toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
          createdAt: new Date('2026-01-01T10:05:00.000Z'),
        },
      ],
    });

    expect(timeline.map((entry) => entry.id)).toEqual([
      'status-1',
      'handoff-1',
      'status-2',
    ]);
    expect(timeline.map((entry) => entry.eventType)).toEqual([
      'status',
      'handoff',
      'status',
    ]);
  });

  it('preserves closure context for completed status entries', () => {
    const timeline = buildTicketHistoryTimeline({
      statusHistory: [
        {
          id: 'status-complete',
          status: TicketStatus.COMPLETED,
          ownerRoleAtChange: TICKET_OWNER_ROLE.PARAMEDIC,
          assignedUnitIdSnapshot: 'unit-7',
          comment: 'Closed on scene',
          createdAt: new Date('2026-01-01T11:00:00.000Z'),
        },
      ],
      handoffs: [],
    });

    expect(timeline).toEqual([
      expect.objectContaining({
        id: 'status-complete',
        eventType: 'status',
        ownerRoleAtChange: TICKET_OWNER_ROLE.PARAMEDIC,
        assignedUnitIdSnapshot: 'unit-7',
        comment: 'Closed on scene',
      }),
    ]);
  });
});
