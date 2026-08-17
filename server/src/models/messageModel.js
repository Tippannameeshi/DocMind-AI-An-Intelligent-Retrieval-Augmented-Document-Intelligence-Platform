const { query, getClient } = require('../config/db');

/**
 * Message Data Access Model using raw SQL queries
 */
class MessageModel {
  /**
   * Create message and store associated chunk citations in a single transaction
   */
  static async createWithCitations({ chatId, sender, content, citations = [] }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert message
      const msgSql = `
        INSERT INTO messages (chat_id, sender, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const msgRes = await client.query(msgSql, [chatId, sender, content]);
      const message = msgRes.rows[0];

      // 2. Update parent chat updated_at timestamp
      await client.query(
        `UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [chatId]
      );

      // 3. Insert citations
      const insertedCitations = [];
      if (citations && citations.length > 0) {
        for (const cit of citations) {
          const citSql = `
            INSERT INTO citations (message_id, chunk_id, similarity_score)
            VALUES ($1, $2, $3)
            RETURNING *;
          `;
          const citRes = await client.query(citSql, [
            message.id,
            cit.chunkId,
            cit.similarityScore || null,
          ]);
          insertedCitations.push({
            ...citRes.rows[0],
            chunk_id: cit.chunkId,
            similarity_score: cit.similarityScore,
            page_number: cit.pageNumber || cit.page_number || 1,
            filename: cit.filename || cit.original_filename || 'Document',
            content: cit.content || '',
          });
        }
      }

      await client.query('COMMIT');
      return {
        ...message,
        citations: insertedCitations,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch messages history for a chat ID with attached citations & source metadata
   */
  static async findByChatId(chatId) {
    const sql = `
      SELECT 
        m.id,
        m.chat_id,
        m.sender,
        m.content,
        m.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', cit.id,
              'chunk_id', c.id,
              'document_id', c.document_id,
              'filename', d.original_filename,
              'page_number', c.page_number,
              'content', c.content,
              'similarity_score', cit.similarity_score
            )
          ) FILTER (WHERE cit.id IS NOT NULL), '[]'
        ) AS citations
      FROM messages m
      LEFT JOIN citations cit ON m.id = cit.message_id
      LEFT JOIN document_chunks c ON cit.chunk_id = c.id
      LEFT JOIN documents d ON c.document_id = d.id
      WHERE m.chat_id = $1
      GROUP BY m.id
      ORDER BY m.created_at ASC;
    `;
    const result = await query(sql, [chatId]);
    return result.rows;
  }
}

module.exports = MessageModel;
