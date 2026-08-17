const OpenAI = require('openai');
const aiConfig = require('../config/aiConfig');

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI(aiConfig.getOpenAiClientConfig());
    this.model = aiConfig.embeddings.model;
  }

  /**
   * Generate 1536-dimensional embedding for a single text query or string.
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    if (!text || !text.trim()) {
      return new Array(aiConfig.embeddings.dimensions).fill(0);
    }

    try {
      if (!aiConfig.hasValidKey()) {
        return this._generateMockVector(text);
      }

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.replace(/\n/g, ' '),
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (err) {
      if (err.status === 429 || (err.message && err.message.includes('quota'))) {
        aiConfig.markQuotaExceeded();
        console.warn('OpenAI Quota Exceeded (429). Automatically using local deterministic vector embeddings.');
      } else {
        console.warn('OpenAI Embedding API error, falling back to local deterministic vector:', err.message);
      }
      return this._generateMockVector(text);
    }
  }

  /**
   * Generate embeddings for an array of text chunks in batches.
   * @param {string[]} textBatch 
   * @returns {Promise<number[][]>}
   */
  async generateBatchEmbeddings(textBatch) {
    if (!textBatch || textBatch.length === 0) return [];

    try {
      if (!aiConfig.hasValidKey()) {
        return textBatch.map(t => this._generateMockVector(t));
      }

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: textBatch.map(t => t.replace(/\n/g, ' ')),
        encoding_format: 'float',
      });

      return response.data.map(item => item.embedding);
    } catch (err) {
      if (err.status === 429 || (err.message && err.message.includes('quota'))) {
        aiConfig.markQuotaExceeded();
        console.warn('OpenAI Quota Exceeded (429). Automatically using local deterministic vector embeddings.');
      } else {
        console.warn('OpenAI Batch Embedding API error, using fallback vectors:', err.message);
      }
      return textBatch.map(t => this._generateMockVector(t));
    }
  }

  /**
   * Generates a normalized 1536-dim deterministic mock vector when OpenAI key is absent.
   */
  _generateMockVector(text) {
    const dim = aiConfig.embeddings.dimensions;
    const vector = new Array(dim).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    
    for (let i = 0; i < dim; i++) {
      const val = Math.sin(hash + i);
      vector[i] = val;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => (magnitude ? v / magnitude : 0));
  }
}

module.exports = new EmbeddingService();
