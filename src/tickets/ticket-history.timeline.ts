import { TicketStatusHistory } from './entities/ticket-status-history.entity';
import { TicketRoleHandoff } from './entities/ticket-role-handoff.entity';

const TICKET_HISTORY_EVENT_TYPE = {
  STATUS: 'status',
  HANDOFF: 'handoff',
} as const;

type TicketHistoryEventType =
  (typeof TICKET_HISTORY_EVENT_TYPE)[keyof typeof TICKET_HISTORY_EVENT_TYPE];

interface TicketStatusHistoryLike {
  id: string;
  createdAt: Date;
  status: TicketStatusHistory['status'];
  changedBy?: TicketStatusHistory['changedBy'];
  comment?: TicketStatusHistory['comment'];
  ownerRoleAtChange?: TicketStatusHistory['ownerRoleAtChange'];
  assignedUnitIdSnapshot?: TicketStatusHistory['assignedUnitIdSnapshot'];
}

interface TicketRoleHandoffLike {
  id: string;
  createdAt: Date;
  fromOwnerRole?: TicketRoleHandoff['fromOwnerRole'];
  toOwnerRole: TicketRoleHandoff['toOwnerRole'];
  changedBy?: TicketRoleHandoff['changedBy'];
  fromAssignedUnitId?: TicketRoleHandoff['fromAssignedUnitId'];
  toAssignedUnitId?: TicketRoleHandoff['toAssignedUnitId'];
  reason?: TicketRoleHandoff['reason'];
  note?: TicketRoleHandoff['note'];
}

interface BuildTicketHistoryTimelineParams {
  statusHistory: TicketStatusHistoryLike[];
  handoffs: TicketRoleHandoffLike[];
}

interface TicketHistoryTimelineBase {
  id: string;
  createdAt: Date;
  eventType: TicketHistoryEventType;
}

export interface TicketStatusTimelineEntry extends TicketHistoryTimelineBase {
  eventType: typeof TICKET_HISTORY_EVENT_TYPE.STATUS;
  status: TicketStatusHistory['status'];
  changedBy?: TicketStatusHistory['changedBy'];
  comment?: TicketStatusHistory['comment'];
  ownerRoleAtChange?: TicketStatusHistory['ownerRoleAtChange'];
  assignedUnitIdSnapshot?: TicketStatusHistory['assignedUnitIdSnapshot'];
}

export interface TicketHandoffTimelineEntry extends TicketHistoryTimelineBase {
  eventType: typeof TICKET_HISTORY_EVENT_TYPE.HANDOFF;
  fromOwnerRole?: TicketRoleHandoff['fromOwnerRole'];
  toOwnerRole: TicketRoleHandoff['toOwnerRole'];
  changedBy?: TicketRoleHandoff['changedBy'];
  fromAssignedUnitId?: TicketRoleHandoff['fromAssignedUnitId'];
  toAssignedUnitId?: TicketRoleHandoff['toAssignedUnitId'];
  reason?: TicketRoleHandoff['reason'];
  note?: TicketRoleHandoff['note'];
}

export type TicketHistoryTimelineEntry =
  | TicketStatusTimelineEntry
  | TicketHandoffTimelineEntry;

export function buildTicketHistoryTimeline({
  statusHistory,
  handoffs,
}: BuildTicketHistoryTimelineParams): TicketHistoryTimelineEntry[] {
  const statusEntries: TicketStatusTimelineEntry[] = statusHistory.map(
    (historyEntry) => ({
      id: historyEntry.id,
      createdAt: historyEntry.createdAt,
      eventType: TICKET_HISTORY_EVENT_TYPE.STATUS,
      status: historyEntry.status,
      changedBy: historyEntry.changedBy,
      comment: historyEntry.comment,
      ownerRoleAtChange: historyEntry.ownerRoleAtChange,
      assignedUnitIdSnapshot: historyEntry.assignedUnitIdSnapshot,
    }),
  );

  const handoffEntries: TicketHandoffTimelineEntry[] = handoffs.map(
    (handoff) => ({
      id: handoff.id,
      createdAt: handoff.createdAt,
      eventType: TICKET_HISTORY_EVENT_TYPE.HANDOFF,
      fromOwnerRole: handoff.fromOwnerRole,
      toOwnerRole: handoff.toOwnerRole,
      changedBy: handoff.changedBy,
      fromAssignedUnitId: handoff.fromAssignedUnitId,
      toAssignedUnitId: handoff.toAssignedUnitId,
      reason: handoff.reason,
      note: handoff.note,
    }),
  );

  return [...statusEntries, ...handoffEntries].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
}
