# 🚀 DocMind AI – Intelligent Retrieval-Augmented Document Intelligence Platform

DocMind AI is a production-ready **Retrieval-Augmented Generation (RAG)** platform that enables users to upload, index, search, and interact with documents using AI-powered semantic retrieval. The system extracts content from documents, generates vector embeddings, stores them in PostgreSQL using **pgvector**, and delivers context-aware responses grounded strictly in retrieved document passages with citation support.

Built with **React, Node.js, Express.js, PostgreSQL, pgvector, and OpenAI API**, the platform provides a scalable solution for document understanding, knowledge retrieval, and AI-assisted learning.

---

# ✨ Features

## 🔐 Authentication & User Management

- Secure user registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Persistent user sessions

---

## 📄 Document Management

- Upload single or multiple documents
- Background document processing
- Automatic text extraction
- Recursive text chunking
- Vector embedding generation
- PostgreSQL pgvector storage
- Document management dashboard

Supported file types include:

- PDF
- TXT
- Markdown
- CSV
- JSON
- LOG
- RTF
- Source code files
- Other supported text-based documents

---

## 🧠 Retrieval-Augmented Generation (RAG)

- Semantic vector search
- pgvector cosine similarity search
- Keyword fallback search
- Multi-document retrieval
- Context-aware AI responses
- Page/section citations
- Zero-hallucination prompting

---

## 💬 AI Chat Assistant

- Multi-session chat
- Chat history
- Multi-document conversations
- Context-aware responses
- Citation support
- Automatic chat title generation

---

## 🤖 AI Document Insights

Generate AI-powered insights from uploaded documents.

- Executive Summary
- Flashcards
- Quiz Generation
- Key Takeaways
- Future Work
- Action Items

---

## 📊 Dashboard

Visual dashboard displaying

- Total Documents
- Total Chats
- Indexed Chunks
- Recent Uploads
- Document Statistics

---

# 🛠 Technology Stack

## Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

## Backend

- Node.js
- Express.js
- MVC Architecture

## Database

- PostgreSQL
- pgvector
- pg

## AI

- OpenAI API
- text-embedding-3-small
- gpt-4o-mini

## File Processing

- Multer
- pdf-parse

---

# 🏗 Architecture

```
React Frontend
       │
       ▼
Express REST API
       │
       ▼
Authentication
       │
       ▼
Document Processing Pipeline
       │
       ▼
Chunking
       │
       ▼
Embedding Generation
       │
       ▼
PostgreSQL + pgvector
       │
       ▼
Semantic Retrieval
       │
       ▼
OpenAI
       │
       ▼
Grounded AI Response
```

---

# 📁 Project Structure

```
DocMind-AI/

├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   ├── sql/
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/yourusername/DocMind-AI.git

cd DocMind-AI
```

---

## Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
```

---

# ⚙ Environment Variables

Create

```
server/.env
```

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_paper_assistant
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret

JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your_api_key

OPENAI_BASE_URL=https://api.openai.com/v1

EMBEDDING_MODEL=text-embedding-3-small

COMPLETION_MODEL=gpt-4o-mini
```

---

# 🗄 Database Setup

Create database

```sql
CREATE DATABASE ai_paper_assistant;
```

Run migration

```bash
cd server

node src/sql/migrate.js
```

---

# ▶ Run Application

Backend

```bash
cd server

npm run dev
```

Frontend

```bash
cd client

npm run dev
```

---

# 📡 REST APIs

| Endpoint | Method |
|------------|---------|
| /api/auth/register | POST |
| /api/auth/login | POST |
| /api/auth/me | GET |
| /api/documents/upload | POST |
| /api/documents | GET |
| /api/documents/:id | GET |
| /api/documents/:id | DELETE |
| /api/chats | POST |
| /api/chats | GET |
| /api/chats/:id | GET |
| /api/chats/:id/messages | POST |
| /api/chats/:id | DELETE |
| /api/ai/generate | POST |
| /api/dashboard/stats | GET |

---

# 🔒 Security

- JWT Authentication
- Password Hashing
- Parameterized SQL Queries
- Protected Routes
- File Type Validation
- File Size Validation
- CORS Protection
- SQL Injection Prevention

---

# 📌 Current Capabilities

- User Authentication
- Document Upload
- Background Document Indexing
- Semantic Search
- Vector Embeddings
- Multi-document Retrieval
- AI Chat
- Citation-based Answers
- AI Summaries
- Flashcards
- Quiz Generation
- Key Takeaways
- Future Work Suggestions
- Dashboard Analytics

---

# 🚀 Future Improvements

- Streaming AI Responses
- Hybrid Search
- Reranking
- Better Citation Viewer
- Drag & Drop Upload
- DOCX Parsing
- Swagger API Documentation
- Request Validation
- Structured Logging
- Rate Limiting
- Docker Deployment
- CI/CD Pipeline
- Responsive UI Enhancements

---

# 👨‍💻 Author

**Ajit Meeshi**

Built using

- React
- Node.js
- Express.js
- PostgreSQL
- pgvector
- OpenAI API

---

# 📄 License

ISC License © 2026