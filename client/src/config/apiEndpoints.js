/**
 * Centralized Client API Endpoint Configuration
 * Easily update server base URLs, timeout settings, and feature flags.
 */
export const API_CONFIG = {
  // Base URL for API calls (Proxied via Vite dev server to http://localhost:5000 in dev)
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',

  // Axios HTTP Request Timeout (in milliseconds)
  timeout: 60000, // 60 seconds

  // Active AI Model Information
  models: {
    embeddings: 'text-embedding-3-small',
    completion: 'gpt-4o-mini',
  },

  // Client Feature Flags
  features: {
    enableMultiDocumentSearch: true,
    enablePageCitations: true,
    enableQuizGenerator: true,
    enableFlashcardsDeck: true,
  },
};

export default API_CONFIG;
