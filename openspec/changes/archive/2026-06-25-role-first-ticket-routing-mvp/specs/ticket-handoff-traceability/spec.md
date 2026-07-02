# ticket-handoff-traceability Specification

## Purpose

Define the audit trail required for role ownership transitions and operational closure in the MVP.

## Requirements

### Requirement: Handoff Event Traceability

The system MUST record every ownership transition as a traceable handoff event. Each handoff record MUST include the ticket, from-role, to-role, acting user, timestamp, and optional note. The trace MUST be created for manual reassignment, privileged override, and service-driven routing changes.

#### Scenario: Dispatcher hands a ticket to doctor

- GIVEN a ticket currently owned by `DISPATCHER`
- WHEN a dispatcher hands it off to `DOCTOR` with a note
- THEN a handoff event records `DISPATCHER` to `DOCTOR`
- AND the actor, timestamp, and note are stored with the event

#### Scenario: Privileged reassignment stays auditable

- GIVEN an admin reassigns a ticket from `MARKETING` to `APPOINTMENT_MANAGER`
- WHEN the reassignment succeeds
- THEN the handoff history shows the prior and new owner roles
- AND the event is distinguishable from a status-only update

### Requirement: Closure Traceability

The system MUST preserve status history and MUST also trace who completed or cancelled the ticket under which owner role. Completion and cancellation records MUST include the final acting user, timestamp, resulting status, and optional closure comment.

#### Scenario: Completion keeps final owner context

- GIVEN a ticket owned by `PARAMEDIC`
- WHEN a paramedic completes it with a closure note
- THEN the audit trail records the completion actor and owner role
- AND the record remains linked to the final status transition

#### Scenario: Cancellation by privileged user is traceable

- GIVEN a ticket owned by `DOCTOR`
- WHEN an admin cancels it with a reason
- THEN the cancellation actor and owner role are stored
- AND the reason is available in the ticket history
