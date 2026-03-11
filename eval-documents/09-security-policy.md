# Information Security Policy

**Owner:** Jordan Liu, CTO  
**Effective:** March 1, 2025  
**Classification:** Internal

## Overview

This policy applies to all Acme Corp employees, contractors, and third-party vendors with access to company systems.

## Authentication & Access Control

- All internal tools require **SSO via Okta**.
- Multi-factor authentication (MFA) is **mandatory** for all employees.
- Production systems use **role-based access control (RBAC)** — principle of least privilege.
- SSH keys must be rotated every **90 days**.
- Service accounts require approval from the Platform squad and are reviewed quarterly.

## Data Classification

| Level | Description | Examples |
|---|---|---|
| Public | Safe to share externally | Marketing website, blog posts |
| Internal | Company-wide access | This handbook, OKRs, org chart |
| Confidential | Need-to-know basis | Customer data, financial records |
| Restricted | Highest sensitivity | Encryption keys, PII databases, SOC 2 evidence |

## Encryption

- **In transit**: TLS 1.3 for all external and internal communications.
- **At rest**: AES-256 encryption for all databases and object storage.
- Encryption keys are managed via **AWS KMS** with automatic annual rotation.

## Compliance

- **SOC 2 Type II**: Audited annually; last audit completed Q3 2025.
- **GDPR**: EU customer data is stored in `eu-west-1` region; DPA agreements with all sub-processors.
- **CCPA**: California residents can request data deletion via privacy@acme.dev.

## Vulnerability Management

- Automated dependency scanning via **Snyk** runs on every PR.
- Penetration testing conducted **twice per year** by an external firm.
- Critical vulnerabilities (CVSS ≥ 9.0) must be patched within **48 hours**.
- High vulnerabilities (CVSS 7.0–8.9) must be patched within **7 days**.

## Reporting Security Issues

Report any security concern to **security@acme.dev** or via the anonymous tip line at `security-tips.acme.dev`. Do not attempt to exploit or validate vulnerabilities on your own.

