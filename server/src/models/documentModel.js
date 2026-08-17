const { query } = require('../config/db');

/**
 * Document Data Access Model using raw SQL queries
 */
class DocumentModel {
  /**
   * Create a new document record
   */
  static async create({ userId, originalFilename, storedFilename, filePath, fileSize, mimeType = 'application/pdf' }) {
    const sql = `
      INSERT INTO documents (user_id, original_filename, stored_filename, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await query(sql, [userId, originalFilename, storedFilename, filePath, fileSize, mimeType]);
    return result.rows[0];
  }

  /**
   * Find document by ID
   */
  static async findById(id, userId = null) {
    let sql = `SELECT * FROM documents WHERE id = $1`;
    const params = [id];

    if (userId) {
      sql += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * List documents for user with optional SQL filtering by search, status, and upload date
   */
  static async findByUserId(userId, filters = {}) {
    let sql = `
      SELECT d.*, 
             COUNT(c.id)::int as chunk_count
      FROM documents d
      LEFT JOIN document_chunks c ON d.id = c.document_id
      WHERE d.user_id = $1
    `;
    const params = [userId];
    let paramIdx = 2;

    if (filters.search && filters.search.trim()) {
      sql += ` AND d.original_filename ILIKE $${paramIdx++}`;
      params.push(`%${filters.search.trim()}%`);
    }

    if (filters.status && filters.status !== 'all') {
      sql += ` AND d.status = $${paramIdx++}`;
      params.push(filters.status);
    }

    if (filters.dateFrom) {
      sql += ` AND d.created_at >= $${paramIdx++}`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += ` AND d.created_at <= $${paramIdx++}`;
      params.push(filters.dateTo);
    }

    sql += `
      GROUP BY d.id
      ORDER BY d.created_at DESC;
    `;
    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Update document status (pending, processing, completed, failed)
   */
  static async updateStatus(id, status, totalPages = 0, errorMessage = null) {
    const sql = `
      UPDATE documents
      SET status = $2,
          total_pages = CASE WHEN $3 > 0 THEN $3 ELSE total_pages END,
          error_message = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await query(sql, [id, status, totalPages, errorMessage]);
    return result.rows[0] || null;
  }

  /**
   * Delete document by ID and return deleted row
   */
  static async delete(id, userId) {
    const sql = `
      DELETE FROM documents
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await query(sql, [id, userId]);
    return result.rows[0] || null;
  }
}

module.exports = DocumentModel;
