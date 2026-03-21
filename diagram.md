================================================================================
           TALK-TO-A-FOLDER: SUBMITTED PROTOTYPE ARCHITECTURE
================================================================================

                           [ NEXT.JS (Frontend) ]
                           (React 19, Tailwind 4)
                                  |  ^
           (POST /ingest or /chat)|  | (NDJSON Stream)
                                  v  |
+==============================================================================+
|                            NESTJS (Backend API)                              |
|                    (In-Memory Session Auth via Google)                       |
+==============================================================================+
               |                                               |
       [ INGESTION FLOW ]                              [ CHAT FLOW ]
               |                                               |
               v                                               v
+-----------------------------+               +--------------------------------+
| 1. FETCH FROM DRIVE         |               | 1. INTENT DETECTION            |
| - Call Google Drive API     |               | - Prompt: Groq (Llama 3 8B)    |
| - Download raw content      |               | - Detects File Action vs Chat  |
+-----------------------------+               +--------------------------------+
               |                                        /             \
               v                               (File Action)         (RAG Chat)
+-----------------------------+                       /                 \
| 2. PARSE & CHUNK            |                      v                   v
| - pdf-parse (for PDFs)      |         +-------------------+  +-------------------+
| - LlamaIndex SentenceSplitter |       | 2A. EXECUTE ACTION|  | 2B. RETRIEVE CHUNKS |
|   (1024 size, 200 overlap)  |         | - Call Drive API  |  | - Embed via OpenAI|
+-----------------------------+         | - Create/Edit/Move|  | - Query ChromaDB  |
               |                        | - Apply Edit via  |  | - Route to files  |
               v                        |   Groq (Llama 3)  |  |   via Groq Llama 3|
+-----------------------------+         +-------------------+  +-------------------+
| 3. EMBED                    |                   |                      |
| - OpenAI API                |                   |                      v
|   (text-embedding-3-small)  |                   |            +-------------------+
+-----------------------------+                   |            | 3. SYNTHESIZE     |
               |                                  |            | - Build Context   |
               v                                  |            | - Prompt Groq     |
+-----------------------------+                   |            |   (groq/compound) |
| 4. STORE                    |                   |            +-------------------+
| - Local ChromaDB            |                   |                      |
| - Meta: folderId, fileId    |                   +----------+-----------+
+-----------------------------+                              |
                                                             v
                                              [ STREAM NDJSON TO FRONTEND ]
                                              (Yields tokens, citations, actions)