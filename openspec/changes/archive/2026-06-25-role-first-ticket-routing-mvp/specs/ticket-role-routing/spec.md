# ticket-role-routing Specification

## Purpose

Define the MVP role model, service-type ownership, and role-based ticket visibility for role-first routing.

## Requirements

### Requirement: MVP Role And Service Taxonomy

The system MUST support the MVP roles `SUPER_ADMIN`, `ADMIN`, `DISPATCHER`, `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, and `MARKETING`. The routing taxonomy MUST map `IMMEDIATE_ATTENTION`, `AMBULANCE`, `HOME_CARE`, and `STUDY_TRANSFER` to `PARAMEDIC`; `TELEMEDICINE` and `MEDICAL_CONSULTATION` to `DOCTOR`; `LABORATORY` and `IMAGING` to `APPOINTMENT_MANAGER`; and `PLANS` to `MARKETING`. The system MUST keep `APPOINTMENT` only for compatibility and MUST treat it as outside the MVP operational flow. The system MUST keep `EQUIPMENT_RENTAL` outside role-queue routing and limited to privileged handling.

#### Scenario: Route a new imaging ticket

- GIVEN a new ticket is created with service type `IMAGING`
- WHEN the routing rules are applied
- THEN the current owner role is `APPOINTMENT_MANAGER`
- AND the ticket is not routed to `PARAMEDIC` or `DOCTOR`

#### Scenario: Preserve appointment compatibility without MVP routing

- GIVEN a ticket exists with service type `APPOINTMENT`
- WHEN a role queue is evaluated
- THEN the ticket remains compatible at the enum/API level
- AND it is excluded from MVP queue ownership rules

### Requirement: Role-Owned Ticket Visibility

The system MUST expose tickets to `SUPER_ADMIN`, `ADMIN`, and `DISPATCHER` with privileged visibility across all MVP-routed tickets. The system MUST expose tickets to non-privileged roles only when the current owner role matches their role. `PARAMEDIC` visibility MUST continue to honor ambulance-unit restrictions for paramedic-owned tickets. `EQUIPMENT_RENTAL` tickets MUST remain visible only to privileged roles in MVP.

#### Scenario: Doctor sees only doctor-owned work

- GIVEN a `DOCTOR` user and tickets owned by `DOCTOR` and `MARKETING`
- WHEN the doctor queue is listed
- THEN only doctor-owned tickets are returned
- AND privileged-only tickets stay hidden

#### Scenario: Dispatcher keeps broad operational visibility

- GIVEN tickets owned by `PARAMEDIC`, `DOCTOR`, `APPOINTMENT_MANAGER`, and `MARKETING`
- WHEN a dispatcher lists tickets
- THEN all MVP-routed tickets are visible
- AND visibility is not reduced by owner role changes

### Requirement: Paramedic Backend Rename Compatibility

The system MUST rename the business-facing backend role from `AMBULANCE` to `PARAMEDIC` as the canonical MVP role model. The implementation MUST include a data and enum migration path so stored `ambulance` values, ambulance-unit relationships, and existing tickets continue to operate without loss. `HOME_CARE` and restored `STUDY_TRANSFER` ownership MUST remain under the paramedic role after migration.

#### Scenario: Existing ambulance data remains valid after rename

- GIVEN persisted users or tickets still reference the legacy ambulance value
- WHEN the MVP compatibility migration is applied
- THEN those records resolve to `PARAMEDIC` behavior
- AND ambulance-unit based constraints still work for paramedic-owned tickets
