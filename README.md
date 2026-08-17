# AI Research Paper Assistant (RAG)

A production-ready **Retrieval-Augmented Generation (RAG)** application designed to analyze scientific research papers (PDFs), parse text page-by-page, generate 1536-dimensional vector embeddings, store vectors in PostgreSQL using `pgvector`, and deliver zero-hallucination AI answers grounded strictly in retrieved context passages with explicit page-level citations.

Built strictly with **Node.js, Express, React (Vite), Tailwind CSS, PostgreSQL (`pg` package), and OpenAI API**. Zero ORMs (No Prisma).

---

## 🌟 Key Features

1. **Authentication & User Management**:
   - Secure Registration & Login using JWT tokens & `bcryptjs` password hashing.
   - Session context persistence with Axios authorization interceptors.
2. **PDF Upload & Vector Indexing**:
   - Upload single or multiple research papers (PDF format, up to 50MB).
   - Asynchronous PDF processing pipeline with page-by-page text parsing via `pdf-parse`.
   - Recursive character chunking preserving page numbers, character offsets, and chunk overlap.
   - 1536-dimensional vector embedding generation using OpenAI `text-embedding-3-small`.
   - Native storage in PostgreSQL `document_chunks` table using `pgvector`.
3. **Zero-Hallucination RAG Question Answering**:
   - Semantic similarity search using `pgvector` cosine distance (`<=>` operator) with HNSW indexing.
   - Context-grounded GPT-4o-mini completions strictly limited to retrieved paper passages.
   - Interactive inline page citations linking answers directly to source passages, page numbers, and vector similarity metrics.
4. **Multi-Document Support**:
   - Query across all uploaded research papers or filter questions to specific selected PDFs.
5. **AI Research Insights Hub**:
   - **Paper Summarizer**: Executive summary, methodology, and primary conclusions.
   - **Interactive Quiz Generator**: 5-question multiple-choice tests with answer checking and context explanations.
   - **Study Flashcards Deck**: Flip cards featuring key terminology and page references.
   - **Key Contributions & Future Work**: Extracted novel scientific contributions and limitations.
6. **Analytics Dashboard**:
   - Metrics summary displaying total documents, total chats, total indexed chunks, and recent uploads.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React icons.
- **Backend**: Node.js, Express.js (MVC Architecture).
- **Database**: PostgreSQL with `pgvector` extension & `pg` connection pool.
- **AI & Embeddings**: OpenAI API (`text-embedding-3-small` and `gpt-4o-mini`).
- **File Processing**: Multer, `pdf-parse`.

---

## 📋 Prerequisites

Before running the project, ensure you have installed:
1. **Node.js**: v18.0.0 or higher.
2. **PostgreSQL**: v14.0 or higher with the `pgvector` extension installed.
   - Installing `pgvector` on Linux/macOS/Windows: [pgvector GitHub Installation Guide](https://github.com/pgvector/pgvector)

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL Credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_paper_assistant
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Authentication
JWT_SECRET=super_secret_jwt_key_ai_paper_assistant_2026
JWT_EXPIRES_IN=7d

# OpenAI API Key & Model Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1 # Optional custom OpenAI-compatible endpoint
EMBEDDING_MODEL=text-embedding-3-small   # Optional (default: text-embedding-3-small)
COMPLETION_MODEL=gpt-4o-mini             # Optional (default: gpt-4o-mini)
```

### ⚡ Easy API & Model Customization

1. **Backend AI Configuration File**: [`server/src/config/aiConfig.js`](file:///c:/Users/tippa/OneDrive/Desktop/Folder/Project/server/src/config/aiConfig.js)
   - Allows switching model providers, custom OpenAI-compatible base URLs (e.g., DeepSeek, LocalAI, Ollama, vLLM), adjusting RAG chunk size/overlap, top-K retrieval counts, and completion temperature in one central file.
2. **Client Endpoint Configuration File**: [`client/src/config/apiEndpoints.js`](file:///c:/Users/tippa/OneDrive/Desktop/Folder/Project/client/src/config/apiEndpoints.js)
   - Allows configuring frontend base URLs, request timeouts, and feature toggles.

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Database Migration (SQL Setup)

Ensure your local PostgreSQL server is running and the database specified in `.env` exists (`CREATE DATABASE ai_paper_assistant;`).

Run the automated raw SQL schema migration script:
```bash
cd server
node src/sql/migrate.js
```

*This script enables the `vector` extension, creates all normalized tables (`users`, `documents`, `document_chunks`, `chats`, `chat_documents`, `messages`, `citations`), and constructs the HNSW cosine vector index.*

### Step 3: Run Development Servers

Open two terminal windows:

**Terminal 1 (Backend Express Server):**
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 (Frontend React Vite Client):**
```bash
cd client
npm run dev
# Client will run on http://localhost:3000
```

---

## 📡 API Reference Overview

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/health` | `GET` | Server status & metadata check | No |
| `/api/db/health` | `GET` | PostgreSQL pool connectivity check | No |
| `/api/auth/register` | `POST` | Register a new user | No |
| `/api/auth/login` | `POST` | Authenticate user & issue JWT | No |
| `/api/auth/me` | `GET` | Get current user profile | Yes |
| `/api/documents/upload` | `POST` | Upload PDF files for RAG processing | Yes |
| `/api/documents` | `GET` | List user's uploaded research papers | Yes |
| `/api/documents/:id` | `DELETE` | Delete PDF and vector embeddings | Yes |
| `/api/chats` | `POST` | Create a new chat session | Yes |
| `/api/chats/:id/messages` | `POST` | Send RAG query & receive cited answer | Yes |
| `/api/ai/generate` | `POST` | Generate summary, quiz, or flashcards | Yes |
| `/api/dashboard/stats` | `GET` | Fetch user dashboard metrics | Yes |

---

## 🔒 Security & Architecture Standards

- **Zero ORM / Pure SQL**: Every database query is executed using `$1` parameterized raw SQL via the native `pg` connection pool.
- **Strict Context Prompting**: OpenAI completion prompts enforce strict constraints ("Answer using ONLY context passages; if unknown, state unable to answer").
- **Transactional Consistency**: Relational database writes (such as saving assistant answers along with chunk citations) are managed within `BEGIN` and `COMMIT` transactions.

---

## 📄 License
ISC License &copy; 2026 AI Research Paper Assistant.
