const { query } = require('../config/db');

/**
 * User Data Access Model using raw SQL queries
 */
class UserModel {
  /**
   * Create a new user
   */
  static async create({ email, passwordHash, fullName }) {
    const sql = `
      INSERT INTO users (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, created_at;
    `;
    const result = await query(sql, [email.toLowerCase(), passwordHash, fullName]);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, full_name, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const result = await query(sql, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const sql = `
      SELECT id, email, full_name, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
}

module.exports = UserModel;
