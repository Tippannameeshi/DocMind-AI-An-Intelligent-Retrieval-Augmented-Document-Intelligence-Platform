const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * AI & LLM Provider Configuration
 * Easily swap API keys, custom base URLs, embedding models, or provider settings.
 */
const aiConfig = {
  // Provider Mode: 'openai' | 'custom' (e.g. DeepSeek, LocalAI, vLLM, Ollama)
  provider: process.env.LLM_PROVIDER || 'openai',

  // API Key Configuration
  apiKey: process.env.OPENAI_API_KEY || '',

  // Optional custom API Base URL for third-party OpenAI-compatible providers
  baseURL: process.env.OPENAI_BASE_URL || undefined,

  // Embedding Model Settings
  embeddings: {
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: 1536, // Must match PostgreSQL vector(1536) column definition
    batchSize: 100,    // Maximum chunks per batch embedding request
  },

  // LLM Text Completion Settings
  completions: {
    model: process.env.COMPLETION_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.COMPLETION_TEMPERATURE || '0.2'),
    maxTokens: parseInt(process.env.COMPLETION_MAX_TOKENS || '1500', 10),
  },

  // RAG Pipeline Parameters
  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '800', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '150', 10),
    topK: parseInt(process.env.RAG_TOP_K || '5', 10),
    minSimilarityScore: parseFloat(process.env.RAG_MIN_SIMILARITY || '0.25'),
  },

  // Circuit breaker flag when quota error occurs
  quotaExceeded: false,

  markQuotaExceeded() {
    this.quotaExceeded = true;
  },

  /**
   * Helper function to build OpenAI SDK configuration options
   */
  getOpenAiClientConfig() {
    const configObj = {
      apiKey: this.apiKey || 'dummy-key',
      maxRetries: 0,
      timeout: 10000,
    };
    if (this.baseURL) {
      configObj.baseURL = this.baseURL;
    }
    return configObj;
  },

  /**
   * Utility to check if a valid API key is present and active
   */
  hasValidKey() {
    if (this.quotaExceeded) return false;
    return Boolean(this.apiKey && !this.apiKey.startsWith('sk-dummy') && this.apiKey.length > 20);
  },
};

module.exports = aiConfig;
