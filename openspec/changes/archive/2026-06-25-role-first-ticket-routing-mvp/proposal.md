# Proposal: Role-First Ticket Routing MVP

## Intent

Model the client workflow with role-owned ticket queues, explicit handoffs, and transition notifications. Prefer roles over groups because the backend already authorizes by role and already has a special-case routing model for `ambulance_units`, while groups would add a whole new membership and access domain before solving MVP traceability.

## Scope

### In Scope

- Add MVP operational roles: `dispatcher`, `ambulance`, `doctor`, `appointment_manager`, `marketing`, `emergency_room`.
- Route tickets by primary owner role while preserving ambulance-unit assignment for ambulance-owned work.
- Add business-level support for current owner role, handoff history, and role-transition notifications.

### Out of Scope

- Generic groups/queues, multi-role membership, or rules engines.
- Renaming backend `AMBULANCE`; UI may relabel it as `Paramedico` or `Unidad movil / Paramedico`.
- New emergency-room intake type, taxonomy cleanup, or SLA automation.

## Capabilities

### New Capabilities

- `ticket-role-routing`: role-first ownership and queue visibility for tickets.
- `ticket-handoff-traceability`: explicit from-role/to-role history with actor, time, and note.
- `ticket-role-notifications`: notify destination role queues on ownership transitions.

### Modified Capabilities

- None.

## Approach

Use role-first routing as the MVP control plane. Keep `dispatcher` as call center intake, keep backend `ambulance` unchanged for compatibility, and map ticket types to primary owner roles: `immediate_attention`, `home_care`, `ambulance` -> `ambulance`; `telemedicine` -> `doctor`; `medical_consultation`, `laboratory`, `appointment`, `equipment_rental` -> `appointment_manager`; `plans` -> `marketing`. `emergency_room` is a handoff target only.

## Affected Areas

| Area                                                   | Impact   | Description                                                          |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------- |
| `src/users/entities/user.entity.ts`                    | Modified | Expand operational role set; keep `AMBULANCE`.                       |
| `src/auth/guards/roles.guard.ts`                       | Modified | Extend role hierarchy for new queues.                                |
| `src/tickets/entities/ticket.entity.ts`                | Modified | Add current owner role without replacing `assignedUnit`.             |
| `src/tickets/entities/ticket-status-history.entity.ts` | Modified | Record role handoffs, not only status changes.                       |
| `src/tickets/tickets.service.ts`                       | Modified | Enforce routing, visibility, handoff, notifications.                 |
| `src/tickets/tickets.gateway.ts`                       | Modified | Emit role-queue transition events plus ambulance-room compatibility. |

## Risks

| Risk                                              | Likelihood | Mitigation                                                    |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| Role growth broadens auth touchpoints             | Med        | Limit MVP to fixed roles and primary-owner routing only.      |
| Partial traceability if history stays status-only | High       | Define dedicated handoff events in MVP scope.                 |
| `AMBULANCE` terminology debt                      | Med        | Relabel in UI now; defer enum rename to a separate migration. |

## Rollback Plan

Revert new ticket ownership/history fields, disable role-transition notifications, and fall back to current dispatcher-plus-ambulance behavior with existing `assignedUnit` flow. If schema changes land, ship a paired rollback migration.

## Dependencies

- Confirm UI labels for `dispatcher` and `ambulance`.
- Align bot/manual intake rules with the routing matrix.

## Success Criteria

- [ ] MVP scope is limited to role-first routing with ambulance compatibility preserved.
- [ ] Every ticket can show current owner role and traceable handoffs.
- [ ] Spec phase can derive concrete capabilities from this proposal without reopening routing decisions.
