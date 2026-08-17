const embeddingService = require('../embeddings/embeddingService');
const ChunkModel = require('../models/chunkModel');

class VectorStore {
  /**
   * Perform semantic search against document_chunks in PostgreSQL pgvector.
   * @param {string} queryText - User question
   * @param {string[]} documentIds - Optional document scope array
   * @param {number} topK - Top chunks count
   */
  static async search(queryText, documentIds = [], topK = 5) {
    const res = await VectorStore.searchWithStats(queryText, documentIds, topK);
    return res.results;
  }

  /**
   * Perform semantic search with precise latency timers for statistics tracking
   */
  static async searchWithStats(queryText, documentIds = [], topK = 5) {
    if (!queryText || !queryText.trim()) {
      return { results: [], embeddingTimeMs: 0, searchTimeMs: 0 };
    }

    let results = [];
    let embeddingTimeMs = 0;
    let searchTimeMs = 0;

    try {
      const embedStart = Date.now();
      const queryEmbedding = await embeddingService.generateEmbedding(queryText);
      embeddingTimeMs = Date.now() - embedStart;

      const searchStart = Date.now();
      results = await ChunkModel.searchSimilarity(queryEmbedding, documentIds, topK);
      searchTimeMs = Date.now() - searchStart;
    } catch (err) {
      console.warn('Vector similarity search failed, trying keyword fallback search:', err.message);
    }

    // 3. Fallback to keyword text search if vector search returned 0 results
    if (!results || results.length === 0) {
      const searchStart = Date.now();
      results = await ChunkModel.searchText(queryText, documentIds, topK);
      searchTimeMs += Date.now() - searchStart;
    }

    return { results, embeddingTimeMs, searchTimeMs };
  }
}

module.exports = VectorStore;

