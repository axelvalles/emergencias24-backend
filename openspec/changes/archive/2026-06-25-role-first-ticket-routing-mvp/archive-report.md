## Archive Report

**Change**: `role-first-ticket-routing-mvp`
**Project**: `emergencias24-backend`
**Artifact store**: `openspec`
**Archived on**: `2026-06-25`
**Verification verdict carried forward**: `PASS_WITH_CAVEAT`

### Executive Summary

The change has been archived after syncing its completed OpenSpec delta specs into the main spec tree. The source of truth now includes the final MVP requirements for role-owned routing, handoff traceability, and role-queue notifications, while preserving the verification caveat around PostgreSQL migration/backfill smoke.

### Inputs Reviewed

- `openspec/changes/role-first-ticket-routing-mvp/exploration.md`
- `openspec/changes/role-first-ticket-routing-mvp/proposal.md`
- `openspec/changes/role-first-ticket-routing-mvp/specs/ticket-role-routing/spec.md`
- `openspec/changes/role-first-ticket-routing-mvp/specs/ticket-handoff-traceability/spec.md`
- `openspec/changes/role-first-ticket-routing-mvp/specs/ticket-role-notifications/spec.md`
- `openspec/changes/role-first-ticket-routing-mvp/design.md`
- `openspec/changes/role-first-ticket-routing-mvp/tasks.md`
- `openspec/changes/role-first-ticket-routing-mvp/verify-report.md`

### Spec Sync Summary

| Domain                        | Action  | Details                                                                                                              |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `ticket-role-routing`         | Created | Main spec did not exist; copied finalized capability spec into `openspec/specs/ticket-role-routing/spec.md`.         |
| `ticket-handoff-traceability` | Created | Main spec did not exist; copied finalized capability spec into `openspec/specs/ticket-handoff-traceability/spec.md`. |
| `ticket-role-notifications`   | Created | Main spec did not exist; copied finalized capability spec into `openspec/specs/ticket-role-notifications/spec.md`.   |

### Source Of Truth Updated

The following main specs now reflect the archived behavior:

- `openspec/specs/ticket-role-routing/spec.md`
- `openspec/specs/ticket-handoff-traceability/spec.md`
- `openspec/specs/ticket-role-notifications/spec.md`

### Archive Verification

- Main specs were updated before archival.
- The change keeps proposal, specs, design, tasks, verify report, and this archive report together in the archive folder.
- `tasks.md` shows 10 of 10 tasks complete.
- The final verification verdict remains `PASS_WITH_CAVEAT`.

### Carried-Forward Caveat

- PostgreSQL-backed migration/backfill smoke was not executed because `POSTGRES_URL` was unavailable.
- Runtime proof is still required for the legacy `ambulance` to `paramedic` migration path and owner-role backfill on a real PostgreSQL instance.

### Final Status

This SDD change is archived as complete with one external follow-up caveat. The implementation, tests, and build evidence passed verification, and the remaining migration smoke step must be tracked outside the archived SDD cycle.

## SDD Result Contract

```yaml
phase: archive
change: role-first-ticket-routing-mvp
project: emergencias24-backend
artifact_store: openspec
report_path: openspec/changes/archive/2026-06-25-role-first-ticket-routing-mvp/archive-report.md
verdict: ARCHIVED_PASS_WITH_CAVEAT
next_phase: none
blocking_items:
  - Run migration/backfill smoke against PostgreSQL once POSTGRES_URL is available.
```
