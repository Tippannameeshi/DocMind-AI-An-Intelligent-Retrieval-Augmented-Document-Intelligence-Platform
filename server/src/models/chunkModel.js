const { query, getClient } = require('../config/db');

/**
 * Chunk Data Access Model with pgvector support using raw SQL
 */
class ChunkModel {
  /**
   * Insert multiple document chunks in a single transaction
   * @param {Array<{documentId: string, chunkIndex: number, content: string, pageNumber: number, startChar: number, endChar: number, embedding: number[]}>} chunks 
   */
  static async bulkInsert(chunks) {
    if (!chunks || chunks.length === 0) return [];

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const insertedRows = [];

      for (const chunk of chunks) {
        const sql = `
          INSERT INTO document_chunks (
            document_id, chunk_index, content, page_number, start_char, end_char, embedding
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
          RETURNING id, document_id, chunk_index, page_number;
        `;
        
        const embeddingVector = chunk.embedding ? JSON.stringify(chunk.embedding) : null;
        
        const res = await client.query(sql, [
          chunk.documentId,
          chunk.chunkIndex,
          chunk.content,
          chunk.pageNumber,
          chunk.startChar || 0,
          chunk.endChar || 0,
          embeddingVector,
        ]);
        insertedRows.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return insertedRows;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Vector Similarity Search using pgvector cosine distance operator (<=>)
   * @param {number[]} queryEmbedding - 1536-dim embedding array
   * @param {string[]} documentIds - Optional filter array of document UUIDs
   * @param {number} limit - Top K results
   */
  static async searchSimilarity(queryEmbedding, documentIds = [], limit = 5) {
    const embeddingVector = JSON.stringify(queryEmbedding);

    let sql = `
      SELECT 
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        c.page_number,
        d.original_filename,
        (1 - (c.embedding <=> $1::vector)) AS similarity_score
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.embedding IS NOT NULL
    `;

    const params = [embeddingVector];

    if (documentIds && documentIds.length > 0) {
      sql += ` AND c.document_id = ANY($2::uuid[])`;
      params.push(documentIds);
    }

    sql += `
      ORDER BY c.embedding <=> $1::vector ASC
      LIMIT $${params.length + 1};
    `;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Keyword Text Search Fallback when vector similarity yields no results or in local fallback mode
   * @param {string} queryText - Search keywords
   * @param {string[]} documentIds - Optional document scope array
   * @param {number} limit - Top K results
   */
  static async searchText(queryText, documentIds = [], limit = 5) {
    const words = queryText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    let sql = `
      SELECT 
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        c.page_number,
        d.original_filename,
        0.85 AS similarity_score
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (documentIds && documentIds.length > 0) {
      params.push(documentIds);
      sql += ` AND c.document_id = ANY($${params.length}::uuid[])`;
    }

    if (words.length > 0) {
      const wordConditions = words.map(w => {
        params.push(`%${w}%`);
        return `c.content ILIKE $${params.length}`;
      });
      sql += ` AND (${wordConditions.join(' OR ')})`;
    }

    sql += ` ORDER BY c.chunk_index ASC LIMIT $${params.length + 1};`;
    params.push(limit);

    const result = await query(sql, params);

    // If word search returned nothing, return top sequential chunks from the document
    if (result.rows.length === 0) {
      let fallbackSql = `
        SELECT 
          c.id,
          c.document_id,
          c.chunk_index,
          c.content,
          c.page_number,
          d.original_filename,
          0.80 AS similarity_score
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE 1=1
      `;
      const fallbackParams = [];
      if (documentIds && documentIds.length > 0) {
        fallbackParams.push(documentIds);
        fallbackSql += ` AND c.document_id = ANY($1::uuid[])`;
      }
      fallbackSql += ` ORDER BY c.chunk_index ASC LIMIT $${fallbackParams.length + 1};`;
      fallbackParams.push(limit);

      const fallbackRes = await query(fallbackSql, fallbackParams);
      return fallbackRes.rows;
    }

    return result.rows;
  }

  /**
   * Delete chunks for a given document ID
   */
  static async deleteByDocumentId(documentId) {
    const sql = `DELETE FROM document_chunks WHERE document_id = $1 RETURNING id;`;
    const result = await query(sql, [documentId]);
    return result.rows;
  }
}

module.exports = ChunkModel;
