# Design: Role-First Ticket Routing MVP

## Executive Summary

Implement role-first routing inside the existing `TicketsModule`, keeping TypeORM entities as the source of truth and reusing the current Socket.IO gateway. The MVP adds a canonical `PARAMEDIC` user role, a separate ticket `currentOwnerRole`, a dedicated handoff table, and scoped notification rooms while preserving `assignedUnit` for paramedic-owned work only.

## Architecture Overview

- **Modules**: `UsersModule` owns role migration and unit compatibility; `TicketsModule` owns routing, handoffs, history, and socket fan-out; `AmbulanceUnitsModule` keeps active-unit constraints.
- **Infrastructure**: TypeORM changes are required; Redis impact is none because the gateway is currently in-process; Twilio impact is limited to enum compatibility for bot-created tickets, not new outbound notifications.
- **Flow**: create/update -> `TicketRoutingPolicy` maps `serviceType` to `currentOwnerRole` -> `TicketsService` persists ticket + audit rows -> `TicketsGateway` emits role-room and unit-room events.

## Data Model Changes

| Area             | Design                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User roles       | Rename `UserRole.AMBULANCE` to `UserRole.PARAMEDIC`; add `DOCTOR`, `APPOINTMENT_MANAGER`, `MARKETING`. Keep `SUPER_ADMIN`, `ADMIN`, `DISPATCHER`.                                                                                                                                                                                                  |
| DB compatibility | Migration recreates `users_role_enum`, rewrites `'ambulance' -> 'paramedic'`, and updates column defaults. Legacy JWTs naturally expire; `JwtStrategy` already reloads the DB user, so old tokens do not block rollout.                                                                                                                            |
| Ticket owner     | Add nullable `currentOwnerRole` column using a new `TicketOwnerRole` enum, separate from `UserRole` so privileged roles and compatibility-only services do not become queue owners. Values: `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, `MARKETING`, `DISPATCHER`, `EMERGENCY_ROOM`.                                                             |
| Service taxonomy | Extend `ServiceType` with `STUDY_TRANSFER` and `IMAGING`. Routing map: paramedic -> `IMMEDIATE_ATTENTION`, `AMBULANCE`, `HOME_CARE`, `STUDY_TRANSFER`; doctor -> `TELEMEDICINE`, `MEDICAL_CONSULTATION`; appointment manager -> `LABORATORY`, `IMAGING`; marketing -> `PLANS`; `APPOINTMENT` and `EQUIPMENT_RENTAL` set `currentOwnerRole = null`. |
| Unit semantics   | Keep `assignedUnit` and `assignedAt`, but only when `currentOwnerRole = PARAMEDIC`. On handoff away from paramedic, clear `assignedUnit` to prevent stale queue visibility.                                                                                                                                                                        |

**Files**: modify `src/users/entities/user.entity.ts`, `src/users/dto/*.ts`, `src/users/users.service.ts`, `src/auth/auth.service.ts`, `src/auth/guards/roles.guard.ts`, `src/tickets/entities/ticket.entity.ts`, `src/tickets/dto/create-ticket.dto.ts`, `src/tickets/dto/query-tickets.dto.ts`; add `src/tickets/entities/ticket-role-handoff.entity.ts` and `src/tickets/ticket-routing.policy.ts`; update relevant specs under `src/**/*.spec.ts`.

## Access-Control Design

- Add `isPrivilegedRole()` and `isOperationalRole()` helpers instead of expanding the current hierarchy ad hoc.
- `SUPER_ADMIN`, `ADMIN`, and `DISPATCHER` bypass owner-role filtering.
- Non-privileged queues filter by `ticket.currentOwnerRole = user.role`.
- Paramedics apply both filters: `currentOwnerRole = PARAMEDIC` and `assignedUnit = activeAmbulanceUnit`; keep the current `ForbiddenException` path from `TicketsService` and `AmbulanceUnitsService`, renamed from ambulance to paramedic wording.
- `EQUIPMENT_RENTAL` stays visible only to privileged roles because it never receives an owner role.

## Traceability And Notification Design

- Keep `ticket_status_history` for lifecycle states, but add `ownerRoleAtChange` and nullable `assignedUnitIdSnapshot` so completion/cancellation preserve final context.
- Add `ticket_role_handoffs` for ownership transitions with: `ticketId`, `fromOwnerRole`, `toOwnerRole`, `changedById`, `fromAssignedUnitId`, `toAssignedUnitId`, `reason`, `note`, `createdAt`.
- `TicketsService.getHistory()` returns a merged timeline sorted by `createdAt`; status changes and handoffs remain distinguishable.
- Extend `TicketsGateway`; do not add a second gateway. Rooms become `tickets`, `tickets:role:<ownerRole>`, and existing `tickets:ambulance-unit:<id>` renamed only internally if desired.
- Emit one role-queue event per committed owner-role transition. If the destination is `PARAMEDIC` and `assignedUnit` exists, also emit to the unit room; otherwise skip unit fan-out to avoid duplicates.

## Migration Plan

1. Migration A: rename user enum values and add new user roles.
2. Migration B: recreate `tickets_servicetype_enum` to include `study_transfer` and `imaging` safely.
3. Migration C: add `tickets.currentOwnerRole`, extend `ticket_status_history`, create `ticket_role_handoffs`, and backfill.
4. Backfill strategy: map existing open tickets by `serviceType`; set paramedic tickets from current `assignedUnit`; set `APPOINTMENT` and `EQUIPMENT_RENTAL` owner role to `NULL`; stamp `ownerRoleAtChange` on existing history from the ticket snapshot at migration time.

## Implementation Slices

1. **Schema and enums**: entities + migrations + DTO enum updates. No chained PR needed if kept to schema/tests.
2. **Routing and access scope**: routing policy, `TicketsService`, controller role metadata, paramedic wording. No chained PR needed if service-only.
3. **Traceability**: handoff entity, merged history, completion/cancellation snapshots.
4. **Notifications and regression tests**: gateway room routing, gateway/controller/service specs, migration tests.

If any slice grows beyond the 400-line review budget, split schema from runtime behavior; otherwise a single linear series is manageable and chained PRs are not required.

## Risks / Mitigations

- **Enum rename risk**: mitigate with explicit SQL value rewrite and full auth/user/unit test coverage.
- **Stale unit visibility**: mitigate by clearing `assignedUnit` on non-paramedic ownership.
- **History ambiguity**: mitigate by separating handoffs from status rows while snapshotting final owner context.

## Next Recommended Phase

`sdd-tasks` - convert the slices above into module-scoped implementation tasks with tests attached to each slice.
