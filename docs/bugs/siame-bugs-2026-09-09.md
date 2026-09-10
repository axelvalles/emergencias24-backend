# SIAME bug triage — 2026-09-09

This backlog contains four product defects, three requested workflow changes, one access-control change, and one operational cleanup. Fix shared causes first: session persistence and shared presentation behavior have a wider blast radius than individual screens.

## Current progress

| Item | Status | Evidence |
| --- | --- | --- |
| 1. Subscription filter labels | Fixed, pending browser run | Web-admin build passes; focused Playwright coverage added. |
| 3. Empty-unit assignment | Fixed and verified | 21 focused backend tests pass; assignment search excludes empty units and forged assignments remain rejected. |
| 5. Missing municipality | Fixed and verified | 8 focused bot tests pass; transition persistence now merges the latest handler-updated session. |
| 6. Handoff terminology | Fixed, pending browser run | Web-admin build passes; audit data is preserved and presentation is localized. |
| 4. Requester contact actions | Fixed and verified | Web-admin build passes; committed as `05cf768`. |
| 7. Secure company-scoped patient import | Fixed and verified | Workbook remains catalog-free; company and plan are selected in SIAME. Backend 15 tests and frontend 6 policy tests pass; committed as `5de0d50`, `76cd3e4`, and `58e7f45`. |
| 8. Operator access boundary | Fixed and verified | Backend authorization tests pass 14/14; frontend policy tests pass 3/3; committed as `b52a64b` and `6660b68`. |
| 2. Third-party payer model | Deferred | Requires an additive contract/payer/beneficiary schema redesign and migration. |
| 9. Test-ticket cleanup | Deferred | Prepare guarded Neon SQL after application work is complete and ticket IDs are confirmed. |

## Recommended implementation order

1. **Protect the workflow:** item 5 (lost municipality) and item 3 (invalid empty-unit choice).
2. **Correct shared presentation:** items 1 and 6.
3. **Apply access boundaries:** item 8.
4. **Add focused workflow improvements:** items 4 and 7.
5. **Design the payer model deliberately:** item 2 requires a domain and migration decision before implementation.
6. **Clean test data last:** item 9, only after the fixes are verified.

## Root-cause clusters

| Cluster | Items | Working diagnosis |
| --- | --- | --- |
| Admin presentation and terminology | 1, 6 | The shared faceted-filter popover constrains content with suspicious unitless arbitrary sizes, while the ticket timeline exposes an internal event term and English relative time directly to Spanish-speaking users. |
| Subscription ownership model | 2 | A subscription requires a patient beneficiary and supports only patient/company payer types. There is no payer-only person identity. |
| Ticket assignment eligibility | 3 | Unit search returns empty units, but ticket assignment rejects them later. The selection surface and write-time invariant disagree. |
| Ticket detail actions | 4 | The requester's phone is rendered as text even though it is already available on the ticket. |
| Bot session persistence | 5 | A handler persists the municipality, then `BotService` writes an older session snapshot over it during the transition. |
| Patient import responsibility | 7 | The patient workbook and importer currently own plan/company assignment, although the requested workflow moves that responsibility to company upload. |
| Operator authorization | 8 | The current `dispatcher` role can navigate several extra modules. Read/write restrictions exist at some backend endpoints, but navigation, route guards, page actions, and supporting API access are not aligned to the requested boundary. |
| Controlled data cleanup | 9 | Test-ticket removal is an environment-specific maintenance operation, not a reusable product feature. |

## Item-by-item acceptance plan

### 1. Subscription filter labels are not visible

- **Classification:** Bug — admin presentation.
- **Evidence/symptom:** The supplied screenshots show checkbox controls without visible option text in the payer/status filter popover. The subscription columns provide valid Spanish labels through `PayerTypeLabels` and `PlanSubscriptionStatusLabels`; `DataTableFacetedFilter` renders `option.label`, but its popover uses `w-[50]` and list uses `max-h-[75]`.
- **Likely surfaces:** Admin `app/components/ui/table/data-table-faceted-filter.tsx` and subscription table column metadata. Because the component is shared, verify every faceted filter, not only subscriptions.
- **Acceptance criteria:** Payer options show **Paciente** and **Empresa**; status options show all Spanish status labels; labels remain visible at supported viewport sizes; selection and reset behavior remain unchanged.
- **Verification target:** Add a focused component test for `DataTableFacetedFilter` if the admin test harness is introduced; otherwise perform an explicit browser check on subscription and plan filters. No current admin unit/spec files were found.
- **Diagnosis confidence:** High for the affected surface; the exact CSS behavior must still be reproduced before editing.

### 2. Allow a payer who is not a patient for family/group plans

- **Classification:** Feature request — subscription domain model.
- **Evidence/symptom:** `PlanSubscription.patient` is non-nullable, `payerPatient` also references `Patient`, and `PayerType` contains only `PATIENT` and `COMPANY`. The creation DTO and admin form both require a patient.
- **Likely surfaces:** Backend subscription entity, DTOs, service rules, migrations, family-member operations, query responses; admin subscription form, types, list/detail displays, and patient subscription views.
- **Acceptance criteria:** A person can own/pay for a family or group plan without becoming a patient; beneficiaries remain explicit patients; payer and beneficiary are distinguishable in reads and audit data; existing patient- and company-paid subscriptions migrate without semantic changes; eligibility and duplicate-plan rules are defined for payer-only owners.
- **Verification targets:** Extend `src/plans/plan-subscriptions.controller.spec.ts`; add service tests for payer-only creation, beneficiary assignment, duplicate protection, and migration compatibility. Add admin form coverage when a frontend harness exists.
- **Open design decision:** Prefer a dedicated payer/person identity or explicit subscription owner over a fake patient record. Final schema and lifecycle rules need approval before implementation.

### 3. Do not offer an empty ambulance unit as a valid assignment

- **Classification:** Bug — ticket assignment eligibility.
- **Evidence/symptom:** `AmbulanceUnitsService.search()` returns units regardless of membership. The admin assignment dialog lists that response unchanged. `TicketsService.assignTicket()` then rejects a selected unit when `members.length === 0`, producing a late failure.
- **Likely surfaces:** Backend ambulance-unit search semantics and ticket assignment invariant; admin ticket assignment dialog and its empty/disabled-state copy.
- **Acceptance criteria:** A unit with no active members cannot be selected as a valid ticket destination; the backend continues to reject forged/stale invalid assignments; if no eligible units exist, the dialog explains how to proceed instead of presenting an empty valid-looking choice.
- **Verification targets:** `src/ambulance-units/ambulance-units.service.spec.ts` for eligible search results and `src/tickets/tickets.service.owner-role.spec.ts` for the write-time invariant; admin browser check for zero eligible units.

### 4. Add quick call and WhatsApp actions for the patient/requester

- **Classification:** Feature request — ticket-detail usability.
- **Evidence/symptom:** `Ticket.requesterPhone` is returned and `TicketViewPage` formats it for display, but the phone is plain text with no `tel:` or WhatsApp action.
- **Likely surfaces:** Admin `app/features/tickets/ticket-view-page.tsx`; possibly a small shared phone-normalization helper. No backend change is expected unless requester and patient phone semantics must be separated.
- **Acceptance criteria:** A valid phone offers one-click call and WhatsApp actions; WhatsApp-prefixed values are normalized; missing/invalid values do not produce broken links; links use safe external-navigation attributes; accessible labels state the action and target.
- **Verification target:** Focused helper/component tests when an admin harness exists, plus browser checks on mobile and desktop with present, absent, and prefixed numbers.

### 5. Municipality is missing from home-care tickets

- **Classification:** Bug — bot session state persistence.
- **Evidence/symptom:** The screenshot shows `Municipio: No especificado` and `municipio: undefined` in the description. `HomeCareWaitingMunicipalityHandler` calls `setMunicipality()`, but `BotService.persistSessionTransition()` later saves `{ ...currentSession, municipality: currentSession.municipality }` from the stale pre-handler snapshot, overwriting the newly persisted municipality. `HomeCareWaitingLocationHandler` then reads `_context.municipality` into both the ticket field and description.
- **Likely surfaces:** Backend bot session transition/persistence and home-care state-machine coverage. The admin correctly renders `ticket.municipality` and should not manufacture it from description text.
- **Acceptance criteria:** A municipality selected during home-care intake survives every intermediate state; the created ticket stores the exact canonical municipality; the description contains that same value and never `undefined`; ambulance intake, specialty state, navigation commands, and session reset retain their intended behavior.
- **Verification targets:** `src/bot/bot.service.spec.ts` for merge/persistence behavior and a new focused home-care state-machine regression test; retain `src/bot/session-store.service.spec.ts` coverage for storage semantics.

### 6. Replace the unclear “Handoff” history label

- **Classification:** Bug — user-facing terminology/localization.
- **Evidence/symptom:** The screenshot shows **Handoff** and English relative time beside an otherwise Spanish timeline. The admin hard-codes `"Handoff"`; the backend intentionally records `ticket_role_handoffs` to preserve ownership audit history.
- **Likely surfaces:** Admin `app/features/tickets/ticket-history-timeline.tsx` and date-fns locale configuration. Backend history should remain intact.
- **Acceptance criteria:** Use a clear Spanish label such as **Cambio de responsable** or **Asignación**; relative time is Spanish; the initial `Sin responsable → Paramédico` event remains auditable without being mistaken for an extra ticket status; pending status is not duplicated to hide the ownership event.
- **Verification targets:** `src/tickets/ticket-history.timeline.spec.ts` protects merged history semantics; add admin timeline rendering coverage when a harness exists, otherwise verify initial assignment and later reassignment manually.
- **Safety note:** Do not delete handoff records or collapse backend event types merely to change presentation.

### 7. Remove plan and company from the patient bulk-import template

- **Classification:** Feature request — import workflow simplification.
- **Evidence/symptom:** `PatientsImportService.generateTemplate()` creates **Plan** and **Empresa** columns plus lookup sheets/dropdowns. `importPatients()` reads columns 9/10 and creates a plan subscription. The requested workflow assigns this information during company upload instead.
- **Likely surfaces:** Backend `src/patients/patients-import.service.ts`, import errors, generated workbook, and import documentation/UI copy. The company-upload flow that will own assignments must be identified before removing the only current path.
- **Acceptance criteria:** The patient template contains only patient identity/contact columns; it has no plan/company lookup sheets or validation lists; importing it creates patients without subscriptions/company assignment; malformed and duplicate-patient reporting still works; the company upload becomes the documented assignment path.
- **Verification target:** Add `src/patients/patients-import.service.spec.ts` for workbook headers and patient-only imports; retain controller download/upload checks in `src/patients/patients.controller.spec.ts`.
- **Compatibility note:** Whether previously downloaded ten-column templates remain temporarily accepted is a product decision; do not silently shift column offsets without a test.

### 8. Restrict the operator to tickets, patients, and read-only subscriptions

- **Classification:** Access-control change.
- **Evidence/symptom:** The repository's current operator role is `dispatcher`. Admin navigation and route rules currently allow it into patients, plans, benefits, subscriptions, companies, tickets, and ambulance units. Backend patient/subscription GET endpoints already allow dispatcher while mutations are mostly admin-only, but other read endpoints remain available for operational dependencies.
- **Likely surfaces:** Admin `app/components/layout/nav-items.ts`, `app/routes/_auth/_layout.tsx`, page-level create/edit/delete actions; backend controller role decorators and integration authorization matrix.
- **Acceptance criteria:** Dispatcher sees and can open only Tickets, Patients, and Subscriptions; Patients and Subscriptions are read-only in the UI and API; direct navigation to hidden modules is denied; write requests remain denied even if crafted manually; ticket operations retain only the minimal supporting reads they need (for example, eligible ambulance-unit lookup) without exposing the full Units module.
- **Verification targets:** Backend `src/security/authz-http.integration.spec.ts`, `src/auth/guards/roles.guard.spec.ts`, `src/patients/patients.controller.spec.ts`, and `src/plans/plan-subscriptions.controller.spec.ts`; add an admin route/navigation authorization test when a harness exists, plus manual direct-URL checks.
- **Safety note:** Hiding sidebar entries is not authorization. Backend policy is authoritative; UI restrictions prevent dead ends and accidental actions.

### 9. Remove selected test tickets

- **Classification:** Operational cleanup — controlled data maintenance.
- **Evidence/symptom:** The client wants several test tickets removed. The request does not justify a generic bulk-delete UI or API.
- **Likely surfaces:** Neon PostgreSQL ticket records and dependent ticket history/handoff data. No application code should be changed for this cleanup.
- **Acceptance criteria:** The exact environment and test-ticket identifiers are confirmed; a preview query shows the rows and dependency counts before deletion; the deletion runs inside an explicit transaction with a rollback checkpoint; post-delete queries prove that only the approved tickets and cascading dependents changed.
- **Delivery note:** Prepare the narrowly scoped Neon SQL script only after items 1–8 are fixed and verified. Prefer explicit immutable ticket IDs or another reviewed predicate. Do not use an unqualified `DELETE`, `TRUNCATE`, or a reusable destructive endpoint.

## Verification and delivery gates

- Reproduce each original screenshot scenario before changing code; the stated mechanism is not a substitute for reproduction.
- Fix shared roots once: do not patch municipality text in the admin, remove backend audit events for localization, or duplicate unit eligibility logic only in the UI.
- Run focused backend tests first, then the full backend suite. The admin currently has no discovered unit/spec files, so introduce focused coverage where practical and record explicit browser scenarios for the remaining UI work.
- Preserve current ticket audit and authorization invariants while changing presentation and navigation.
- Keep the Neon cleanup separate from application migrations and deployments.

## Out of scope

- A generic ticket bulk-delete feature.
- Production data deletion before an approved preview.
- Removing ticket handoff audit records or changing audit history solely for wording.
- Creating payer-only people as fake patients without an approved domain model.
- Expanding the operator's privileges to solve UI dependencies; use the minimum supporting read permission instead.

## Evidence references

- Source note and five screenshots: `C:\Users\agabr\OneDrive\Documentos\Obsidian Vault\Siame bugs 09-09-2026.md`.
- Backend: subscription entity/controller/service, bot session store and state handlers, ticket and ambulance-unit services, patient import service, controller role decorators, and existing Jest targets.
- Admin: shared faceted filter, subscription columns, ticket view/timeline/assignment dialog, navigation items, route-role rules, and access-control helper.
