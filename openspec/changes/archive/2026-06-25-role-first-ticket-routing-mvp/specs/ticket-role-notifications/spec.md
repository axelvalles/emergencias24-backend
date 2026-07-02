# ticket-role-notifications Specification

## Purpose

Define the minimum notification behavior for role ownership transitions in the MVP.

## Requirements

### Requirement: Destination Role Queue Notification

The system MUST notify the destination owner queue whenever a ticket is created into, or handed off into, an MVP-owned role. Notifications MUST be emitted for `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, and `MARKETING` ownership transitions, and privileged roles MUST continue to receive broad operational awareness through existing admin-side monitoring channels.

#### Scenario: New laboratory ticket notifies appointment managers

- GIVEN a new ticket is routed to `APPOINTMENT_MANAGER`
- WHEN the create flow finishes
- THEN the appointment-manager queue receives a ticket notification
- AND the notification identifies the ticket and current owner role

#### Scenario: Handoff notifies the destination queue

- GIVEN a ticket moves from `DOCTOR` to `MARKETING`
- WHEN the handoff is committed
- THEN the marketing queue receives a transition notification
- AND the notification reflects the new owner role only once

### Requirement: Paramedic Compatibility Notification

The system MUST preserve ambulance-room compatibility for paramedic-owned tickets. When a ticket enters `PARAMEDIC` ownership, the system MUST notify the paramedic role queue and MUST continue unit-scoped delivery where ambulance-unit assignment is present.

#### Scenario: Home care ticket reaches a unit-backed paramedic queue

- GIVEN a `HOME_CARE` ticket is owned by `PARAMEDIC` and assigned to an ambulance unit
- WHEN the transition is emitted
- THEN the paramedic queue is notified
- AND the assigned ambulance-unit room also receives the update

#### Scenario: Privileged-only rental ticket does not notify an operational queue

- GIVEN an `EQUIPMENT_RENTAL` ticket is created or updated
- WHEN notifications are evaluated
- THEN no `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, or `MARKETING` queue is notified
- AND privileged handling remains the only MVP path
