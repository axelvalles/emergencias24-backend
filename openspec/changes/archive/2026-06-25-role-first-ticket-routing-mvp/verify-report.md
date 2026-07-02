## Verification Report

**Change**: `role-first-ticket-routing-mvp`
**Version**: N/A
**Mode**: Standard
**Artifact store**: `openspec`

### Executive Summary

The implementation matches the approved role-first MVP routing shape: the backend now uses `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, and `MARKETING` alongside privileged roles; tickets resolve a `currentOwnerRole`; privileged visibility stays broad; operational visibility is owner-role scoped; paramedic unit compatibility is preserved; handoffs and closure context are auditable; and gateway delivery fans out to role rooms plus unit rooms for paramedic-owned work. Targeted unit tests, targeted e2e coverage, `pnpm typecheck`, and `pnpm build` all passed during this verification run.

The only material verification gap is database-backed migration smoke. The rename/backfill migrations are present and statically coherent, but runtime proof against a real PostgreSQL instance could not be executed because `POSTGRES_URL` was unavailable.

### Completeness

| Metric           | Value |
| ---------------- | ----- |
| Tasks total      | 10    |
| Tasks complete   | 10    |
| Tasks incomplete | 0     |

### Spec Compliance Checklist

| Area                    | Requirement / Scenario                                                                                          | Evidence                                                                                                                                                                                          | Status       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Role model              | Privileged roles plus `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, `MARKETING` exist in the runtime role model | `src/users/entities/user.entity.ts`, `src/auth/guards/roles.guard.ts`, `src/users/dto/create-user.dto.spec.ts`                                                                                    | ✅ COMPLIANT |
| Service taxonomy        | `IMAGING` routes to `APPOINTMENT_MANAGER`                                                                       | `src/tickets/ticket-routing.policy.ts`, `src/tickets/ticket-routing.policy.spec.ts`                                                                                                               | ✅ COMPLIANT |
| Service taxonomy        | `STUDY_TRANSFER` is restored and routes to `PARAMEDIC`                                                          | `src/tickets/entities/ticket.entity.ts`, `src/tickets/ticket-routing.policy.ts`, `src/tickets/ticket-routing.policy.spec.ts`                                                                      | ✅ COMPLIANT |
| Service taxonomy        | `APPOINTMENT` remains compatibility-only and outside MVP queue routing                                          | `src/tickets/ticket-routing.policy.ts`, `src/tickets/ticket-routing.policy.spec.ts`                                                                                                               | ✅ COMPLIANT |
| Service taxonomy        | `EQUIPMENT_RENTAL` remains privileged-only and unrouted                                                         | `src/tickets/ticket-routing.policy.ts`, `src/tickets/tickets.service.ts`, `src/tickets/ticket-routing.policy.spec.ts`                                                                             | ✅ COMPLIANT |
| Owner-role routing      | Owner-role matrix matches the approved mapping                                                                  | `src/tickets/ticket-routing.policy.ts`, `src/migrations/1780850000000-AddTicketCurrentOwnerRole.ts`, `src/tickets/ticket-routing.policy.spec.ts`                                                  | ✅ COMPLIANT |
| Visibility              | `SUPER_ADMIN`, `ADMIN`, `DISPATCHER` keep broad visibility across routed work                                   | `src/tickets/tickets.service.ts`, `src/tickets/tickets.service.owner-role.spec.ts`                                                                                                                | ✅ COMPLIANT |
| Visibility              | Operational roles only see tickets whose `currentOwnerRole` matches their role                                  | `src/tickets/tickets.service.ts`, `src/tickets/tickets.service.owner-role.spec.ts`                                                                                                                | ✅ COMPLIANT |
| Visibility              | `EQUIPMENT_RENTAL` stays hidden from operational queues                                                         | `src/tickets/tickets.service.ts`, routing null-owner behavior in `src/tickets/ticket-routing.policy.ts`                                                                                           | ✅ COMPLIANT |
| Paramedic compatibility | Paramedic users still require active-unit compatibility and unit-scoped access                                  | `src/tickets/tickets.service.ts`, `src/users/users.service.ts`, `src/tickets/tickets.service.active-unit.spec.ts`, `test/tickets-role-routing.e2e-spec.ts`                                        | ✅ COMPLIANT |
| Traceability            | Ownership transitions create auditable handoff rows with actor/from/to/unit/note                                | `src/tickets/entities/ticket-role-handoff.entity.ts`, `src/tickets/tickets.service.ts`, `src/tickets/tickets.service.owner-role.spec.ts`                                                          | ✅ COMPLIANT |
| Traceability            | Completion/cancellation retain final owner-role and unit context                                                | `src/tickets/entities/ticket-status-history.entity.ts`, `src/tickets/ticket-history.timeline.ts`, `src/tickets/tickets.service.owner-role.spec.ts`, `src/tickets/ticket-history.timeline.spec.ts` | ✅ COMPLIANT |
| Notifications           | Destination role queues are notified on create/handoff into routed work                                         | `src/tickets/tickets.gateway.ts`, `src/tickets/tickets.gateway.spec.ts`                                                                                                                           | ✅ COMPLIANT |
| Notifications           | Paramedic transitions notify both the paramedic role room and the assigned unit room                            | `src/tickets/tickets.gateway.ts`, `src/tickets/tickets.gateway.spec.ts`                                                                                                                           | ✅ COMPLIANT |
| Notifications           | Privileged monitoring remains broad through the existing global `tickets` channel                               | `src/tickets/tickets.gateway.ts`, `src/tickets/tickets.gateway.spec.ts`                                                                                                                           | ✅ COMPLIANT |
| Migration compatibility | Persisted legacy `ambulance` role data migrates to `paramedic` behavior without loss                            | `src/migrations/1780830000000-RenameAmbulanceRoleToParamedic.ts`, `src/migrations/1780850000000-AddTicketCurrentOwnerRole.ts`                                                                     | ⚠️ PARTIAL   |

### Evidence Reviewed

#### Runtime evidence executed in this verify phase

- `pnpm test -- --runInBand src/tickets/ticket-routing.policy.spec.ts src/tickets/tickets.service.owner-role.spec.ts src/tickets/tickets.service.active-unit.spec.ts src/tickets/ticket-history.timeline.spec.ts src/tickets/tickets.gateway.spec.ts` -> 5 suites passed, 25 tests passed.
- `pnpm test:e2e -- --runInBand test/tickets-role-routing.e2e-spec.ts` -> 1 suite passed, 4 tests passed.
- `pnpm typecheck` -> passed.
- `pnpm build` -> passed.

#### Previously reported full-suite evidence reviewed

- `pnpm test` -> PASS.
- `pnpm test:e2e` -> PASS.
- `pnpm typecheck` -> PASS.
- `pnpm build` -> PASS.

#### Static implementation evidence reviewed

- `src/users/entities/user.entity.ts`
- `src/auth/guards/roles.guard.ts`
- `src/users/users.service.ts`
- `src/tickets/entities/ticket.entity.ts`
- `src/tickets/ticket-owner-role.ts`
- `src/tickets/ticket-routing.policy.ts`
- `src/tickets/tickets.service.ts`
- `src/tickets/entities/ticket-role-handoff.entity.ts`
- `src/tickets/entities/ticket-status-history.entity.ts`
- `src/tickets/tickets.gateway.ts`
- `src/migrations/1780830000000-RenameAmbulanceRoleToParamedic.ts`
- `src/migrations/1780840000000-RebuildTicketServiceTypeEnumForRoleFirstMvp.ts`
- `src/migrations/1780850000000-AddTicketCurrentOwnerRole.ts`

### Deviations Or Caveats

- Database-backed migration smoke was NOT executed because `POSTGRES_URL` was unavailable in this environment.
- The user-role rename and ticket owner-role backfill migrations are present and look internally consistent, but the legacy `ambulance` -> `paramedic` runtime path is only statically verified here.
- No additional deviation from the approved routing, visibility, traceability, or notification design was found in source inspection.

### Final Verdict

**PASS_WITH_CAVEAT**

The MVP implementation is functionally compliant with the approved role-first routing design and its targeted regression coverage passed, but final migration confidence remains conditional on running the PostgreSQL-backed migration/backfill smoke step.

### Next Recommended Phase

`sdd-archive`

## SDD Result Contract

```yaml
phase: verify
change: role-first-ticket-routing-mvp
project: emergencias24-backend
artifact_store: openspec
report_path: openspec/changes/role-first-ticket-routing-mvp/verify-report.md
verdict: PASS_WITH_CAVEAT
next_phase: sdd-archive
blocking_items:
  - Run migration/backfill smoke against PostgreSQL once POSTGRES_URL is available.
```
