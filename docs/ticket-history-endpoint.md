# Technical Specification: Ticket History Endpoint

## 1. Endpoint Overview

- **Method:** `GET`
- **Path:** `/tickets/:id/history`
- **Description:** Retrieves the status change history for a specific ticket, ordered by creation date in ascending order.
- **Security:** Protected by `JwtAuthGuard`.

## 2. Expected Response Structure

The endpoint returns an array of `TicketStatusHistory` objects.

**Response Body (Array of Objects):**

```json
[
  {
    "id": "018c8a5a-...",
    "status": "PENDING",
    "comment": null,
    "createdAt": "2023-10-27T10:00:00.000Z",
    "changedBy": {
      "id": "...",
      "firstName": "...",
      "lastName": "..."
    }
  },
  {
    "id": "018c8a5b-...",
    "status": "ASSIGNED",
    "comment": "Asignado a Juan Perez",
    "createdAt": "2023-10-27T10:05:00.000Z",
    "changedBy": {
      "id": "...",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
]
```

### Field Definitions:
- `id` (string): UUID of the history record.
- `status` (enum): The status the ticket was changed to (`PENDING`, `ASSIGNED`, `COMPLETED`, `CANCELLED`).
- `comment` (string | null): Optional comment or reason for the status change.
- `createdAt` (date-string): Timestamp of the change.
- `changedBy` (object | null): The user who performed the action.

## 3. Implementation Details

### Controller Method
In [`src/tickets/tickets.controller.ts`](src/tickets/tickets.controller.ts):

```typescript
@Get(':id/history')
@UseGuards(JwtAuthGuard)
getHistory(@Param('id', ParseUUIDPipe) id: string) {
  return this.ticketsService.getHistory(id);
}
```

### Service Method Signature
In [`src/tickets/tickets.service.ts`](src/tickets/tickets.service.ts):

```typescript
/**
 * Retrieves the status history for a specific ticket.
 * @param ticketId The UUID of the ticket.
 * @returns A list of history records ordered by createdAt ASC.
 */
async getHistory(ticketId: string): Promise<TicketStatusHistory[]> {
  // Implementation should:
  // 1. Verify ticket existence (optional, but recommended)
  // 2. Query historyRepository with relations ['changedBy']
  // 3. Order by createdAt ASC
}
```
