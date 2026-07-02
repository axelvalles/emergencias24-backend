# Tasks: Role-First Ticket Routing MVP

## Review Workload Forecast

| Field                   | Value                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Estimated changed lines | 900-1300                                                                                     |
| 400-line budget risk    | High                                                                                         |
| Chained PRs recommended | Yes                                                                                          |
| Suggested split         | PR1 schema+roles -> PR2 routing+access -> PR3 traceability+notifications -> PR4 verification |
| Delivery strategy       | ask-always                                                                                   |
| Chain strategy          | pending                                                                                      |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                            | Likely PR | Notes            |
| ---- | ------------------------------- | --------- | ---------------- |
| 1    | Roles, enums, migrations        | PR 1      | Safe schema base |
| 2    | Routing and access scope        | PR 2      | Depends on PR1   |
| 3    | Handoffs and notifications      | PR 3      | Depends on PR2   |
| 4    | Regression and e2e verification | PR 4      | Depends on PR3   |

## Phase 1: Foundation

- [x] 1.1 Add `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, `MARKETING` role support in `src/users/entities/user.entity.ts`, `src/users/dto/create-user.dto.ts`, `src/users/dto/update-user.dto.ts`, `src/users/users.service.ts`, `src/auth/auth.service.ts`, `src/auth/guards/roles.guard.ts`; deps: none; accept: create/login/update/guard flows treat paramedic as unit-bound role.
- [x] 1.2 Extend ticket enums in `src/tickets/entities/ticket.entity.ts`, `src/tickets/dto/create-ticket.dto.ts`, `src/tickets/dto/query-tickets.dto.ts`, bot ticket creators under `src/bot/**`, and `src/municipality-pricing/municipality-pricing.service.ts`; deps: 1.1; accept: `IMAGING` and restored `STUDY_TRANSFER` compile, `APPOINTMENT` stays compatibility-only, `EQUIPMENT_RENTAL` stays privileged-only.
- [x] 1.3 Create migrations after existing files in `src/migrations/` for role rename, service-type enum rebuild, `tickets.currentOwnerRole`, history snapshots, and `ticket_role_handoffs` backfill; deps: 1.1-1.2; accept: existing `ambulance` rows migrate to `paramedic` and open tickets receive correct owner role or `NULL`.

## Phase 2: Routing And Access

- [x] 2.1 Add `src/tickets/ticket-routing.policy.ts` and wire `src/tickets/tickets.module.ts`; deps: 1.2; accept: service types map to owner roles exactly as design requires, including `NULL` for `APPOINTMENT` and `EQUIPMENT_RENTAL`.
- [x] 2.2 Update `src/tickets/entities/ticket.entity.ts`, `src/tickets/tickets.service.ts`, `src/tickets/tickets.controller.ts`, `src/tickets/dto/action-ticket.dto.ts`, `src/tickets/dto/update-ticket.dto.ts`; deps: 1.3,2.1; accept: create/assign/handoff/start/complete/cancel keep `assignedUnit` only for paramedic-owned tickets and clear it on non-paramedic handoff.
- [x] 2.3 Refactor visibility rules in `src/tickets/tickets.service.ts`, `src/tickets/tickets.controller.ts`, `src/ambulance-units/ambulance-units.service.ts`; deps: 2.2; accept: admin/super-admin/dispatcher see all routed work, operational roles see matching `currentOwnerRole`, paramedics still require active unit.

## Phase 3: Traceability And Notifications

- [x] 3.1 Add `src/tickets/entities/ticket-role-handoff.entity.ts` and merged history logic in `src/tickets/tickets.service.ts`; deps: 1.3,2.2; accept: each ownership change stores from/to role, actor, unit snapshots, reason/note, and history returns ordered mixed events.
- [x] 3.2 Extend `src/tickets/tickets.gateway.ts` for `tickets:role:<role>` rooms with paramedic+unit fan-out; deps: 2.3,3.1; accept: create/handoff emits one destination role event and unit-room compatibility only for paramedic tickets.

## Phase 4: Tests

- [x] 4.1 Add/refresh specs in `src/auth/**/*.spec.ts`, `src/users/**/*.spec.ts`, `src/tickets/**/*.spec.ts`, `test/**/*.e2e-spec.ts`; deps: 1.1-3.2; accept: cover imaging routing, study-transfer paramedic ownership, privileged rental visibility, handoff audit rows, completion/cancel snapshots, and role-room notifications.

## Phase 5: Final Verification

- [x] 5.1 Run `pnpm test`, `pnpm test:e2e`, `pnpm build`, and migration/backfill smoke checks; deps: 4.1; accept: all specs pass and migrated legacy ambulance data remains accessible as paramedic behavior.
