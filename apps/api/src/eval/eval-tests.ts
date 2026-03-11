import type { EvalTestCase } from "@talk-to-a-folder/shared";

/**
 * Built-in evaluation test cases covering the app's core capabilities.
 */
export const EVAL_TESTS: EvalTestCase[] = [
  // ── RAG Retrieval ──────────────────────────────────────────────────────
  {
    id: "rag-basic-question",
    name: "Basic RAG question",
    category: "rag",
    message: "What files are in this folder?",
    description: "Asks a simple question that should retrieve context and cite sources",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectsNoContext: false,
    },
  },
  {
    id: "rag-specific-file",
    name: "Question about specific file content",
    category: "rag",
    message: "Summarize the contents of the first file you can find",
    description: "Should retrieve and cite a specific file",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectsNoContext: false,
    },
  },
  {
    id: "rag-multi-file",
    name: "Cross-file question",
    category: "rag",
    message: "Compare the information across different files in this folder",
    description: "Should pull context from multiple files",
    assertions: {
      expectsCitations: true,
      minCitations: 2,
      expectsNoContext: false,
    },
  },

  // ── Intent Detection ───────────────────────────────────────────────────
  {
    id: "intent-question-not-action",
    name: "Question should NOT trigger file action",
    category: "intent_detection",
    message: "What is the meaning of life?",
    description: "A general question should not trigger any file operations",
    assertions: {
      expectsFileAction: false,
    },
  },
  {
    id: "intent-about-files-not-action",
    name: "Question about files should NOT trigger action",
    category: "intent_detection",
    message: "How many files are in this folder?",
    description: "Asking ABOUT files should be a RAG query, not a file action",
    assertions: {
      expectsFileAction: false,
    },
  },
  {
    id: "intent-create-detected",
    name: "Create file intent detected",
    category: "intent_detection",
    message: "Create a new file called eval-test-output.txt with the content 'hello from eval'",
    description: "Should detect create_file intent",
    assertions: {
      expectsFileAction: true,
      expectedActionTypes: ["create_file"],
    },
  },
  {
    id: "intent-rename-detected",
    name: "Rename intent detected",
    category: "intent_detection",
    message: "Rename eval-test-output.txt to eval-renamed.txt",
    description: "Should detect rename_file intent",
    assertions: {
      expectsFileAction: true,
      expectedActionTypes: ["rename_file"],
    },
  },

  // ── File Actions ───────────────────────────────────────────────────────
  {
    id: "file-create-txt",
    name: "Create a text file",
    category: "file_action",
    message: "Create a file called _eval_test_create.txt with content 'eval test file'",
    description: "Should create a .txt file in the folder",
    assertions: {
      expectsFileAction: true,
      expectedActionTypes: ["create_file"],
    },
  },
  {
    id: "file-create-folder",
    name: "Create a folder",
    category: "file_action",
    message: "Create a new folder called _eval_test_folder",
    description: "Should create a sub-folder",
    assertions: {
      expectsFileAction: true,
      expectedActionTypes: ["create_folder"],
    },
  },

  // ── Edge Cases ─────────────────────────────────────────────────────────
  {
    id: "edge-empty-message",
    name: "Very short ambiguous message",
    category: "edge_case",
    message: "hi",
    description: "A greeting should not crash and should not trigger file actions",
    assertions: {
      expectsFileAction: false,
    },
  },
  {
    id: "edge-no-context",
    name: "Question about non-existent topic",
    category: "edge_case",
    message: "What does this folder say about quantum teleportation in the 5th dimension?",
    description: "Should gracefully indicate no relevant info found or answer cautiously",
    assertions: {
      forbiddenKeywords: ["error", "exception", "stack trace"],
    },
  },
  {
    id: "edge-long-message",
    name: "Very long input message",
    category: "edge_case",
    message: "Please tell me " + "everything you know about ".repeat(20) + "the files in this folder.",
    description: "Should handle long input without crashing",
    assertions: {
      expectsFileAction: false,
    },
  },

  // ── Acme Corp Golden Dataset ────────────────────────────────────────
  // These tests are designed to run against the eval-documents/ folder
  // (fictional Acme Corp company handbook & product specs).

  // --- Single-document retrieval ---
  {
    id: "acme-company-founded",
    name: "Company founding details",
    category: "rag",
    message: "When was Acme Corp founded and who are the founders?",
    description: "Should retrieve founding info from company overview",
    idealAnswer: "Acme Corp was founded in 2019 by CEO Maya Patel and CTO Jordan Liu in Austin, Texas.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["2019", "maya patel", "jordan liu", "austin"],
      expectedSourceFiles: ["01-company-overview.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-arr",
    name: "Annual recurring revenue",
    category: "rag",
    message: "What is Acme Corp's annual recurring revenue?",
    description: "Should cite the company overview with the $42M ARR figure",
    idealAnswer: "Acme Corp's Annual Recurring Revenue (ARR) is $42M as of FY 2025.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["42"],
      expectedSourceFiles: ["01-company-overview.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-pto-policy",
    name: "PTO vacation days",
    category: "rag",
    message: "How many vacation days do employees get at Acme Corp?",
    description: "Should retrieve the 20-day vacation policy from PTO doc",
    idealAnswer: "All full-time employees receive 20 vacation days per year, accruing monthly. Up to 5 unused days carry over into the next calendar year.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["20"],
      expectedSourceFiles: ["06-pto-and-benefits.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-parental-leave",
    name: "Parental leave policy",
    category: "rag",
    message: "What is the parental leave policy at Acme Corp?",
    description: "Should find the 16-week parental leave policy",
    idealAnswer: "Acme Corp provides 16 weeks of fully paid parental leave for all new parents, including birth, adoption, and foster placement.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["16 weeks", "paid"],
      expectedSourceFiles: ["06-pto-and-benefits.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-sev1-response",
    name: "SEV-1 incident response time",
    category: "rag",
    message: "What is the required response time for a SEV-1 incident?",
    description: "Should retrieve incident response plan severity details",
    idealAnswer: "SEV-1 incidents (complete service outage or data breach) require a response within 15 minutes. Mitigation must be achieved within 1 hour. A blameless post-mortem is required within 72 hours.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["15 minutes"],
      expectedSourceFiles: ["07-incident-response-plan.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-api-rate-limits",
    name: "API rate limits for Pro tier",
    category: "rag",
    message: "What are the API rate limits for the Pro tier?",
    description: "Should retrieve rate limit table from API docs",
    idealAnswer: "The Pro tier allows 300 requests per minute, 50,000 requests per day, and 20 concurrent connections.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["300", "50,000"],
      expectedSourceFiles: ["10-api-rate-limits.md"],
      expectsFileAction: false,
    },
  },

  // --- Cross-document retrieval ---
  {
    id: "acme-ai-copilot-cross",
    name: "AI Copilot owner and OKR targets",
    category: "rag",
    message: "Who leads the AI Copilot feature and what are the Q4 OKR targets for the AI & Search squad?",
    description: "Should pull from org chart, product spec, and OKRs",
    idealAnswer: "Mei Zhang leads the AI & Search squad and the AI Copilot feature. Q4 OKR targets include: shipping the AI Copilot beta to 50 customers, improving semantic search NDCG@10 from 0.72 to 0.82, and adding a risk flagging feature for at-risk tasks.",
    assertions: {
      expectsCitations: true,
      minCitations: 2,
      expectedKeywords: ["mei zhang"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-eng-setup-stack",
    name: "Dev setup and tech stack",
    category: "rag",
    message: "How do I set up my local dev environment and what tech stack does Acme use?",
    description: "Should retrieve from engineering onboarding guide",
    idealAnswer: "Clone the monorepo, run pnpm install, start services with docker compose up -d (PostgreSQL 16, Redis 7, MinIO), then pnpm dev for frontend on port 3000 and API on port 4000. Tech stack: React 19, TypeScript 5.4, Tailwind CSS 4, NestJS 11, PostgreSQL 16, Redis 7, Elasticsearch 8.12, AWS S3, GitHub Actions CI/CD, AWS EKS.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["pnpm", "docker", "postgresql", "nestjs"],
      expectedSourceFiles: ["05-engineering-onboarding.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-security-encryption",
    name: "Encryption and compliance standards",
    category: "rag",
    message: "What encryption standards and compliance certifications does Acme have?",
    description: "Should cite the security policy doc",
    idealAnswer: "Acme uses TLS 1.3 for all data in transit and AES-256 encryption for all data at rest. Encryption keys are managed via AWS KMS with automatic annual rotation. Compliance certifications include SOC 2 Type II (audited annually, last in Q3 2025), GDPR (EU data in eu-west-1), and CCPA.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["aes-256", "tls"],
      expectedSourceFiles: ["09-security-policy.md"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-taskboard-crdt",
    name: "Task Board collaboration technology",
    category: "rag",
    message: "How does real-time collaboration work in Task Board v3.0?",
    description: "Should retrieve CRDT/Yjs details from taskboard spec",
    idealAnswer: "Task Board v3.0 supports real-time collaborative editing on task descriptions using Yjs CRDT library with a y-websocket provider. Multiple users can edit simultaneously with cursor presence and selection highlights shown in real time.",
    assertions: {
      expectsCitations: true,
      minCitations: 1,
      expectedKeywords: ["yjs", "crdt"],
      expectedSourceFiles: ["03-product-spec-taskboard.md"],
      expectsFileAction: false,
    },
  },

  // --- Hallucination checks ---
  {
    id: "acme-no-hallucinate-ceo",
    name: "Should not hallucinate wrong CEO",
    category: "rag",
    message: "Who is the CEO of Acme Corp?",
    description: "Should say Maya Patel and NOT hallucinate a different name",
    idealAnswer: "The CEO of Acme Corp is Maya Patel. She co-founded the company in 2019 along with CTO Jordan Liu.",
    assertions: {
      expectsCitations: true,
      expectedKeywords: ["maya patel"],
      forbiddenKeywords: ["john", "steve", "elon", "jeff"],
      expectsFileAction: false,
    },
  },
  {
    id: "acme-no-hallucinate-nonexistent",
    name: "Should not invent information",
    category: "rag",
    message: "What is Acme Corp's policy on cryptocurrency reimbursement?",
    description: "Should indicate no relevant info found — no crypto policy exists",
    idealAnswer: "There is no information about a cryptocurrency reimbursement policy in the available documents. Acme Corp does not appear to have such a policy.",
    assertions: {
      forbiddenKeywords: ["bitcoin", "ethereum", "crypto reimbursement policy"],
      expectsFileAction: false,
    },
  },
];

