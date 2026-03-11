# Engineering Onboarding Guide

**Last Updated:** 2025-09-01  
**Maintainer:** Priya Nair

## Welcome!

Welcome to the Acme Corp engineering team. This guide will help you get productive in your first two weeks.

## Day 1 Checklist

- [ ] Laptop setup — follow the script at `setup.acme.dev`
- [ ] Get access to GitHub org `acme-corp` (ask your manager)
- [ ] Join Slack channels: `#engineering`, `#incidents`, `#your-squad`
- [ ] Set up local development environment (see Section 3)
- [ ] Complete security training module in LMS (mandatory within 48 hours)

## Local Development Setup

1. **Clone the monorepo**: `git clone git@github.com:acme-corp/acme-platform.git`
2. **Install dependencies**: `pnpm install` (we use pnpm 9.x)
3. **Start services**: `docker compose up -d` — spins up PostgreSQL 16, Redis 7, and MinIO
4. **Run the dev server**: `pnpm dev` — starts frontend on port 3000 and API on port 4000
5. **Run tests**: `pnpm test` — runs Jest unit tests; `pnpm test:e2e` for Playwright end-to-end tests

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.4, Tailwind CSS 4 |
| API | NestJS 11, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Search | Elasticsearch 8.12 |
| Object Storage | AWS S3 (MinIO for local dev) |
| CI/CD | GitHub Actions |
| Hosting | AWS EKS (Kubernetes 1.29) |

## Code Review Process

- All PRs require **at least 2 approvals** before merge.
- PRs must pass CI (lint, unit tests, e2e tests, type check).
- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`.
- Squash-merge into `main`; no direct pushes.

## On-Call Rotation

Every engineer joins the on-call rotation after their first 90 days. Rotations are one week long, Monday to Monday. The on-call playbook is at `wiki.acme.dev/oncall`.

## Key Contacts

- **Priya Nair** (VP Eng) — escalation path for cross-squad issues
- **Tomás Rivera** (Platform Lead) — infrastructure & DevOps questions
- **Mei Zhang** (AI & Search Lead) — anything related to embeddings, LLMs

