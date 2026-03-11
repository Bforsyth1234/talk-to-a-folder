# Product Spec — AI Copilot Feature

**Author:** Mei Zhang  
**Last Updated:** 2025-10-20  
**Status:** In Development

## Overview

The AI Copilot is an in-app assistant that helps users manage their projects using natural language. It is accessible via a chat panel docked to the right side of the application.

## Capabilities

1. **Smart Task Creation** — Users describe tasks in natural language; the copilot creates structured tasks with title, description, assignee, due date, and priority.
2. **Project Summarization** — "Summarize this sprint" produces a bullet-point summary of completed, in-progress, and blocked tasks.
3. **Status Reports** — "Generate a weekly status report" creates a formatted report suitable for stakeholders.
4. **Search & Retrieve** — "Find all tasks assigned to Maya that are overdue" queries the task database.
5. **Risk Flagging** — Proactively warns about tasks that are likely to miss their deadlines based on velocity data.

## Architecture

- **LLM Provider**: OpenAI GPT-4o (via Azure OpenAI Service)
- **Embeddings**: text-embedding-3-large (1536 dimensions)
- **Vector Store**: Pinecone (serverless, us-east-1)
- **Orchestration**: LangChain with tool-calling agents
- **Rate Limit**: 30 requests per user per minute
- **Context Window**: Up to 128k tokens; responses capped at 4,096 tokens

## Privacy & Security

- No customer data is used for model training.
- All LLM calls route through Acme's Azure tenant — data never leaves our cloud boundary.
- PII redaction is applied before any data reaches the LLM.
- SOC 2 Type II audit completed in Q3 2025.

## Success Metrics

| Metric | Target |
|---|---|
| Task creation accuracy (auto-parsed fields) | ≥ 90% |
| User adoption (monthly active users of copilot) | ≥ 40% of total MAU |
| Median response latency | < 2 seconds |
| CSAT for copilot interactions | ≥ 4.2 / 5 |

