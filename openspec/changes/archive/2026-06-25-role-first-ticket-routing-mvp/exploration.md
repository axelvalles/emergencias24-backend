## Exploration: role-first-ticket-routing-mvp

### Current State

The backend already uses role-based authorization and has no groups model. Current roles are `super-admin`, `admin`, `dispatcher`, and `ambulance`. Ticket workflow is centered on `tickets`, `ticket_status_history`, and WebSocket events, with one important specialization: ambulance users are not just a role, they are tied to `ambulance_units`, an `activeAmbulanceUnit`, unit-scoped ticket visibility, and unit-scoped socket rooms. Tickets currently store `serviceType`, `status`, `priority`, `assignedUnit`, `assignedAt`, `completedAt`, and a free-text `note`. History exists, but it only records status changes plus optional comment and actor; it does not record handoff targets, owner role changes, notification delivery, or closure metadata beyond status timestamps.

### Affected Areas

- `src/users/entities/user.entity.ts` — current role enum and ambulance-specific user relations.
- `src/auth/guards/roles.guard.ts` — role hierarchy is hard-coded and would need expansion for new operational roles.
- `src/tickets/entities/ticket.entity.ts` — current service types, status model, and assignment fields are unit-specific rather than generic role ownership.
- `src/tickets/entities/ticket-status-history.entity.ts` — traceability exists only for status transitions, not handoffs.
- `src/tickets/tickets.service.ts` — ticket filtering, access control, assignment, start/complete/cancel flow, and history creation are where role-first routing would land.
- `src/tickets/tickets.controller.ts` — route access is explicitly role-scoped and currently assumes the existing four-role model.
- `src/tickets/tickets.gateway.ts` — real-time updates exist, but audience targeting is global or ambulance-unit-specific only.
- `src/ambulance-units/ambulance-units.service.ts` — active unit selection and membership validation are tightly coupled to the `ambulance` role.
- `src/users/users.service.ts` — user creation/update logic clears or enforces ambulance unit membership based on role.
- `src/migrations/1780800000000-SplitOperatorIntoDispatcherAndAmbulance.ts` — database enum and migration history already institutionalize `ambulance` as a stored role value.
- `src/migrations/1780810000000-CreateAmbulanceUnits.ts` — historical data migration moved ticket assignment from user-level to ambulance-unit-level, which increases rename risk.

### Approaches

1. **Role-first MVP** — route tickets to business roles and keep ambulance-unit specialization only where it already exists.
   - Pros: Fits the current codebase, avoids inventing a new groups domain, lets the client see handoffs by responsibility area quickly, and keeps the MVP cognitively simple.
   - Cons: Some workflows will still need explicit handoff history and a generic role-owner field; emergency room will exist as a role before it has a dedicated service type.
   - Effort: Medium.

2. **Groups-first routing** — introduce generic groups/queues and make roles secondary.
   - Pros: More flexible long term, especially if one person belongs to multiple operational queues.
   - Cons: The codebase has zero existing groups model, so this would require new membership, authorization, filtering, assignment, migration, and notification abstractions before solving the client's MVP workflow.
   - Effort: High.

### Recommendation

Use a role-first MVP. It is the best fit for the described business flow because the backend already enforces access through roles and already has one specialized routing concept (`ambulance_units`) instead of generic groups. The safest MVP is to keep global platform roles (`super-admin`, `admin`) and add operational ownership roles for `call_center`, `doctor`, `appointment_manager`, `marketing`, and `emergency_room`, while keeping backend `ambulance` unchanged for compatibility and relabeling it in the UI as the mobile-unit/paramedic function. Service-type routing should stay simple: new tickets enter through call center or bot intake, then a current owner role determines the active queue, and handoffs become explicit history events. Emergency room should be modeled as a handoff target role in MVP, not as a new intake type yet.

### Risks

- Renaming backend enum `AMBULANCE` now would touch database enums, migrations, auth role checks, seed scripts, unit membership logic, socket room rules, tests, and any persisted JWT/session expectations.
- Current history is status-only, so if handoffs are added without a dedicated event model, traceability will remain partial and misleading.
- Current ticket ownership is `assignedUnit`, not generic `assignedRole`, so forcing all roles into the ambulance assignment model would create the wrong abstraction.
- Emergency room has no current `ServiceType`, so trying to model it as a first-class intake type in MVP adds unnecessary schema and UI scope.
- There is a code/migration inconsistency around `study_transfer`: a migration adds it, but the current `ServiceType` enum does not expose it. That should stay out of this MVP unless ticket taxonomy work is reopened explicitly.

### Ready for Proposal

Yes — propose a role-first MVP that adds role-owned ticket routing and handoff traceability, preserves ambulance compatibility in the backend, and defers groups plus non-essential workflow sophistication.

### Executive Summary

- A role-first MVP is the right choice because the backend already runs on roles and has no groups model at all.
- The minimum safe operational roles are call center, mobile unit/paramedic, doctor, appointment manager, marketing, and emergency room, plus existing admin/super-admin platform roles.
- Backend `AMBULANCE` should stay as-is for now; change only the UI label to avoid a risky enum/data/migration cascade.
- Current traceability is limited to status history; MVP needs explicit handoff events and current owner role tracking to satisfy the client's core workflow.
- Emergency room should be a handoff destination role in MVP, not a new ticket intake type.

### Current Relevant Backend Model

#### Current roles

- `SUPER_ADMIN` -> `super-admin`
- `ADMIN` -> `admin`
- `DISPATCHER` -> `dispatcher`
- `AMBULANCE` -> `ambulance`

#### Current ticket service types

- `IMMEDIATE_ATTENTION`
- `TELEMEDICINE`
- `HOME_CARE`
- `MEDICAL_CONSULTATION`
- `AMBULANCE`
- `LABORATORY`
- `APPOINTMENT`
- `EQUIPMENT_RENTAL`
- `PLANS`

#### Current ticket lifecycle / status history pieces already present

- Ticket statuses: `pending`, `assigned`, `in_progress`, `completed`, `cancelled`.
- `ticket_status_history` stores `ticket`, `status`, `changedBy`, `comment`, `createdAt`.
- `tickets.service` writes history on create, assign, start, complete, and cancel.
- `tickets.gateway` emits real-time events for create/update/assign/complete/cancel.
- Tickets store `assignedAt` and `completedAt`, but not `assignedRole`, `assignedBy`, `completedBy`, `closedReason`, or handoff metadata.

#### Current ambulance-specific logic affected by renaming to paramedic

- `UserRole.AMBULANCE` is stored in the DB enum and used in auth hierarchy.
- `User` has `ambulanceUnits` and `activeAmbulanceUnit` relations.
- `UsersService` and `AuthService` auto-clear or enforce active unit state based on `AMBULANCE`.
- `AmbulanceUnitsService` only allows active ambulance users as members and only ambulance users can choose an active unit.
- `TicketsService` limits ambulance users to tickets assigned to their active unit.
- `TicketsController` and `AmbulanceUnitsController` grant endpoints directly to `AMBULANCE`.
- `TicketsGateway` uses `AMBULANCE` to join unit-specific socket rooms.
- Seed/migration files use the literal role value `ambulance` and create compatibility data around it.

### Recommended MVP Role Model

#### Exact roles

- `SUPER_ADMIN` — platform administration only.
- `ADMIN` — business administration and broad operational visibility.
- `DISPATCHER` — keep backend enum, use it as the call center / intake-dispatch role.
- `AMBULANCE` — keep backend enum, use it as the mobile unit / paramedic role.
- `DOCTOR` — new role for telemedicine and medical execution.
- `APPOINTMENT_MANAGER` — new role for consultation, lab, and study coordination.
- `MARKETING` — new role for affiliation plan follow-up.
- `EMERGENCY_ROOM` — new role for escalated urgent procedures.

#### Exact Spanish labels

- `SUPER_ADMIN` -> `Superadministrador`
- `ADMIN` -> `Administrador`
- `DISPATCHER` -> `Call center / Central operativa`
- `AMBULANCE` -> `Unidad movil / Paramedico`
- `DOCTOR` -> `Medico`
- `APPOINTMENT_MANAGER` -> `Gestor de citas`
- `MARKETING` -> `Marketing`
- `EMERGENCY_ROOM` -> `Sala de emergencia`

#### Rename decision for backend enum `AMBULANCE`

Leave backend code as-is for the MVP and relabel it in the UI.

Why:

- The role is not just a label; it is coupled to DB enums, migrations, auth checks, socket routing, active-unit logic, seed scripts, and tests.
- The client's immediate need is operational clarity, not technical renaming purity.
- UI relabeling gets the business language right now without a risky compatibility migration.

### Recommended Ticket-Type-to-Role Matrix

| Ticket service type    | Primary MVP owner role | Notes                                                                        |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `IMMEDIATE_ATTENTION`  | `AMBULANCE`            | Fits current mobile-unit flow.                                               |
| `HOME_CARE`            | `AMBULANCE`            | Same mobile-unit operational model.                                          |
| `AMBULANCE`            | `AMBULANCE`            | Keep unit-based assignment behavior.                                         |
| `TELEMEDICINE`         | `DOCTOR`               | Direct clinical handling.                                                    |
| `MEDICAL_CONSULTATION` | `APPOINTMENT_MANAGER`  | Coordinate first, then optionally hand off to `DOCTOR`.                      |
| `LABORATORY`           | `APPOINTMENT_MANAGER`  | Operational coordination, not ambulance routing.                             |
| `APPOINTMENT`          | `APPOINTMENT_MANAGER`  | Scheduling/coordination role.                                                |
| `PLANS`                | `MARKETING`            | Follow-up and commercial workflow.                                           |
| `EQUIPMENT_RENTAL`     | `APPOINTMENT_MANAGER`  | Best operational fit for MVP unless a separate logistics role appears later. |

Additional routing notes:

- All new tickets should initially be visible to `DISPATCHER` when created manually by staff, unless auto-routed by service type.
- Bot-created tickets can auto-route by service type immediately after creation.
- `EMERGENCY_ROOM` should receive tickets by handoff/escalation, not by direct service-type mapping in MVP.

### Recommended Phased MVP Scope

#### In MVP now

- Role-first routing with a generic current owner role on tickets.
- Keep ambulance-unit assignment for ambulance-owned tickets only.
- Role-based ticket visibility rules by current owner role, with admin/super-admin broad access.
- Explicit handoff history entries showing from-role, to-role, actor, timestamp, and optional comment.
- Real-time notifications to the relevant role queue and ambulance-unit room where applicable.
- Closure traceability using existing status flow plus explicit actor/comment on completion/cancellation.

#### Later

- Generic groups/queues beyond roles.
- Multi-role users or blended queue memberships.
- Dedicated emergency-room intake service type.
- Rich SLA/escalation rules, auto-reassignment, and unread notification inboxes.
- Full taxonomy cleanup for `study_transfer` and other service-type refinements.
- Backend rename from `AMBULANCE` to `PARAMEDIC` or `MOBILE_UNIT` after a dedicated compatibility/migration change.

### Risks / Tradeoffs

- Role-first is intentionally less flexible than groups, but it matches the current architecture and reduces MVP risk.
- Keeping `AMBULANCE` in code creates terminology debt, but changing it now is a wider migration than the business value justifies.
- `MEDICAL_CONSULTATION` can plausibly belong to doctor or appointment manager; choosing appointment manager first optimizes coordination, not pure clinical ownership.
- Adding many roles increases auth and filtering touchpoints, so the MVP should avoid role-specific custom behavior unless the workflow truly needs it.

### Next Recommended SDD Phase

`sdd-propose` — define the MVP change around generic role ownership, role visibility rules, explicit handoff history, and ambulance compatibility preservation.
