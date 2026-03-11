# Incident Response Plan

**Owner:** Tomás Rivera, Platform Squad Lead  
**Last Reviewed:** 2025-08-15  
**Approved by:** Jordan Liu, CTO

## Severity Levels

| Level | Definition | Response Time | Example |
|---|---|---|---|
| SEV-1 | Complete service outage or data breach | 15 minutes | Production database down |
| SEV-2 | Major feature degraded for >10% of users | 30 minutes | Task board not loading |
| SEV-3 | Minor feature degraded | 4 hours | Notification emails delayed |
| SEV-4 | Cosmetic issue or low-impact bug | Next business day | Misaligned button in dark mode |

## Incident Workflow

1. **Detection** — Alerts from Datadog, PagerDuty, or user reports.
2. **Triage** — On-call engineer assigns severity level.
3. **Communication** — Post in `#incidents` Slack channel; for SEV-1/2, page the Incident Commander.
4. **Mitigation** — Fix or roll back. All SEV-1 incidents must have mitigation within **1 hour**.
5. **Resolution** — Confirm service restored; update status page.
6. **Post-mortem** — Required for SEV-1 and SEV-2 within **72 hours**. Blameless format.

## Roles During an Incident

- **Incident Commander (IC)**: Coordinates response; single point of authority.
- **Technical Lead**: Drives the technical investigation and fix.
- **Comms Lead**: Updates stakeholders, status page, and customer-facing channels.

## Post-Mortem Template

Every post-mortem must include:

1. Timeline of events
2. Root cause analysis (5 Whys)
3. Impact assessment (users affected, duration, revenue impact)
4. Action items with owners and due dates
5. Lessons learned

Post-mortems are stored in Notion at `notion.acme.dev/postmortems`.

## Escalation Path

1. On-call engineer
2. Squad lead
3. VP of Engineering (Priya Nair)
4. CTO (Jordan Liu)

For security incidents, also notify **security@acme.dev** immediately.

