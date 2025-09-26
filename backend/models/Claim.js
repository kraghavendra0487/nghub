const pool = require('../config/database');

class Claim {
  // Get all claims
  static async findAll() {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        ORDER BY cl.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all claims:', error);
      throw error;
    }
  }

  // Get claim by ID
  static async findById(id) {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cl.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding claim by ID:', error);
      throw error;
    }
  }

  // Get claims by card ID
  static async findByCardId(cardId) {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cl.card_id = $1
        ORDER BY cl.created_at DESC
      `;
      const result = await pool.query(query, [cardId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding claims by card ID:', error);
      throw error;
    }
  }

  // Get claims by customer ID
  static async findByCustomerId(customerId) {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cu.id = $1
        ORDER BY cl.created_at DESC
      `;
      const result = await pool.query(query, [customerId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding claims by customer ID:', error);
      throw error;
    }
  }

  // Get claims by employee ID
  static async findByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cu.employee_id = $1
        ORDER BY cl.created_at DESC
      `;
      const result = await pool.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding claims by employee ID:', error);
      throw error;
    }
  }

  // Create new claim
  static async create(claimData) {
    try {
      const { card_id, amount, description, claim_type, status } = claimData;
      const query = `
        INSERT INTO claims (card_id, amount, description, claim_type, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [card_id, amount, description, claim_type, status];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  }

  // Update claim
  static async update(id, claimData) {
    try {
      const { amount, description, claim_type, status } = claimData;
      const query = `
        UPDATE claims 
        SET amount = $1, description = $2, claim_type = $3, status = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      const values = [amount, description, claim_type, status, id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating claim:', error);
      throw error;
    }
  }

  // Delete claim
  static async delete(id) {
    try {
      const query = 'DELETE FROM claims WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting claim:', error);
      throw error;
    }
  }

  // Get claims by status
  static async findByStatus(status) {
    try {
      const query = `
        SELECT cl.*, c.card_number, cu.name as customer_name, cu.email as customer_email
        FROM claims cl
        LEFT JOIN cards c ON cl.card_id = c.id
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cl.status = $1
        ORDER BY cl.created_at DESC
      `;
      const result = await pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding claims by status:', error);
      throw error;
    }
  }
}

module.exports = Claim;
