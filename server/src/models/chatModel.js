const { query, getClient } = require('../config/db');

/**
 * Chat Data Access Model using raw SQL queries
 */
class ChatModel {
  /**
   * Create a new chat session with associated document IDs
   */
  static async create({ userId, title = 'New Research Chat', documentIds = [] }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Create chat
      const chatSql = `
        INSERT INTO chats (user_id, title)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const chatRes = await client.query(chatSql, [userId, title]);
      const chat = chatRes.rows[0];

      // 2. Associate documents in chat_documents junction table
      if (documentIds && documentIds.length > 0) {
        for (const docId of documentIds) {
          const assocSql = `
            INSERT INTO chat_documents (chat_id, document_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
          `;
          await client.query(assocSql, [chat.id, docId]);
        }
      }

      await client.query('COMMIT');
      return chat;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Find chat by ID with attached documents
   */
  static async findById(id, userId) {
    const sql = `
      SELECT 
        c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'original_filename', d.original_filename
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM chats c
      LEFT JOIN chat_documents cd ON c.id = cd.chat_id
      LEFT JOIN documents d ON cd.document_id = d.id
      WHERE c.id = $1 AND c.user_id = $2
      GROUP BY c.id;
    `;
    const result = await query(sql, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * List all chats for a user
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT 
        c.*,
        COUNT(m.id)::int as message_count
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC;
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Update chat title
   */
  static async updateTitle(id, userId, title) {
    const sql = `
      UPDATE chats
      SET title = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await query(sql, [id, userId, title]);
    return result.rows[0] || null;
  }

  /**
   * Delete chat by ID
   */
  static async delete(id, userId) {
    const sql = `
      DELETE FROM chats
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await query(sql, [id, userId]);
    return result.rows[0] || null;
  }
}

module.exports = ChatModel;
