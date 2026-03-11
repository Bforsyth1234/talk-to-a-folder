# API Rate Limits & Usage Tiers

**Author:** Ben Okafor, Integrations Squad Lead  
**Last Updated:** 2025-11-01

## Overview

Acme Corp's public REST API enforces rate limits to ensure fair usage and platform stability. Limits vary by subscription tier.

## Rate Limits by Tier

| Tier | Requests/min | Requests/day | Concurrent Connections |
|---|---|---|---|
| Free | 60 | 5,000 | 5 |
| Pro | 300 | 50,000 | 20 |
| Enterprise | 1,000 | 500,000 | 100 |

## Rate Limit Headers

Every API response includes the following headers:

- `X-RateLimit-Limit` — Maximum requests allowed in the current window
- `X-RateLimit-Remaining` — Requests remaining in the current window
- `X-RateLimit-Reset` — Unix timestamp when the window resets

## Exceeded Limit Behavior

When a client exceeds the rate limit:

1. The API returns HTTP **429 Too Many Requests**.
2. The response body includes a `retry_after` field (in seconds).
3. Clients should implement **exponential backoff** starting at 1 second.

Repeated violations (>10 consecutive 429s) may trigger a **temporary 15-minute ban**.

## Authentication

All API requests require a **Bearer token** in the `Authorization` header. Tokens are generated in the Acme dashboard under **Settings → API Keys**.

- Tokens do not expire by default but can be revoked at any time.
- Each organization can have up to **25 active API keys**.
- Scopes: `read`, `write`, `admin`. Keys should use the minimum required scope.

## Webhook Limits

- Each organization can register up to **50 webhook endpoints**.
- Webhook payloads are retried **3 times** with exponential backoff on failure (1s, 10s, 60s).
- Maximum payload size: **256 KB**.

## Endpoint Versioning

The API is versioned via URL path: `/api/v1/`, `/api/v2/`, etc. Deprecated versions receive **6 months** of maintenance before removal. Currently supported versions: **v1** and **v2**.

