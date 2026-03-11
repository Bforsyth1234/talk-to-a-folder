# Product Spec — Task Board v3.0

**Author:** Derek Olsen  
**Last Updated:** 2025-11-15  
**Status:** Approved

## Overview

Task Board v3.0 is a complete redesign of the core task management interface. The primary goals are:

1. Reduce average task-creation time from 18 seconds to under 8 seconds.
2. Support **swimlane views** grouped by assignee, priority, or custom field.
3. Introduce **real-time collaborative editing** on task descriptions (powered by CRDTs).

## Key Features

### 3.1 Quick-Create Bar

A persistent input bar at the top of every board. Users type a natural language sentence (e.g., "Design landing page by Friday for Maya") and the system auto-extracts:

- Task title
- Assignee
- Due date
- Priority (if mentioned)

### 3.2 Swimlane Views

Users can toggle between:

- **Kanban columns** (default)
- **Swimlanes by assignee**
- **Swimlanes by priority** (Critical → Low)
- **Swimlanes by custom field** (e.g., "Team", "Sprint")

### 3.3 Real-Time Collaboration

Multiple users can edit the same task description simultaneously. Conflict resolution uses **Yjs CRDT** library. Cursor presence and selection highlights are shown in real time.

## Technical Requirements

- Frontend: React 19, TypeScript 5.4
- State sync: Yjs + y-websocket provider
- Backend: NestJS with PostgreSQL 16
- Performance target: Board loads with 500 tasks in < 1.2 seconds (P95)

## Milestones

| Milestone | Target Date |
|---|---|
| Design review | 2025-12-01 |
| Alpha build | 2026-01-15 |
| Beta (internal dogfood) | 2026-02-15 |
| GA release | 2026-03-30 |

## Open Questions

1. Should we support offline mode in v3.0 or defer to v3.1?
2. Max concurrent editors per task description — cap at 10 or unlimited?

