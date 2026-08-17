const path = require('path');
const fs = require('fs');
const { parseDocument } = require('../utils/fileParser');
const RecursiveTextSplitter = require('../chunking/textSplitter');
const embeddingService = require('../embeddings/embeddingService');
const ChunkModel = require('../models/chunkModel');
const DocumentModel = require('../models/documentModel');

class PdfService {
  /**
   * Complete pipeline to process an uploaded document (PDF, TXT, MD, CSV, JSON, code, etc.)
   * @param {string} documentId 
   * @param {string} filePath 
   */
  static async processDocument(documentId, filePath) {
    try {
      // 1. Update status to processing
      await DocumentModel.updateStatus(documentId, 'processing');

      // Fetch document metadata for original filename
      const doc = await DocumentModel.findById(documentId);

      // 2. Parse document text (supports PDF, TXT, MD, CSV, JSON, code)
      const parsed = await parseDocument(filePath, doc?.original_filename || '');

      // 3. Split into structured chunks preserving section/page numbers
      const splitter = new RecursiveTextSplitter({ chunkSize: 800, chunkOverlap: 150 });
      const rawChunks = splitter.splitPages(parsed.pages, documentId);

      if (rawChunks.length === 0) {
        throw new Error('Document file contained no extractable text.');
      }

      // 4. Generate batch embeddings via OpenAI
      const textContents = rawChunks.map(c => c.content);
      const embeddings = await embeddingService.generateBatchEmbeddings(textContents);

      // 5. Attach embeddings to chunks
      const chunksWithEmbeddings = rawChunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx],
      }));

      // 6. Store vectors in PostgreSQL database via raw SQL transaction
      await ChunkModel.bulkInsert(chunksWithEmbeddings);

      // 7. Update document status to completed
      const updatedDoc = await DocumentModel.updateStatus(
        documentId,
        'completed',
        parsed.numPages
      );

      return updatedDoc;
    } catch (err) {
      console.error(`Error processing PDF document [${documentId}]:`, err);
      await DocumentModel.updateStatus(documentId, 'failed', 0, err.message);
      throw err;
    }
  }

  /**
   * Delete document file from filesystem and record from database
   */
  static async deleteDocument(documentId, userId) {
    const document = await DocumentModel.findById(documentId, userId);
    if (!document) {
      const error = new Error('Document not found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    // Delete chunks from Postgres (Handled by ON DELETE CASCADE, but explicit call for clean teardown)
    await ChunkModel.deleteByDocumentId(documentId);

    // Delete document row
    const deletedDoc = await DocumentModel.delete(documentId, userId);

    // Delete file from disk if it exists
    if (document.file_path && fs.existsSync(document.file_path)) {
      try {
        fs.unlinkSync(document.file_path);
      } catch (err) {
        console.warn('Failed to delete physical file:', err.message);
      }
    }

    return deletedDoc;
  }
}

module.exports = PdfService;
