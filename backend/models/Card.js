const pool = require('../config/database');

class Card {
  // Get card by customer ID
  static async findByCustomerId(customerId) {
    try {
      const query = `
        SELECT c.*, cu.name as customer_name, cu.email as customer_email
        FROM cards c
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE c.customer_id = $1
      `;
      const result = await pool.query(query, [customerId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding card by customer ID:', error);
      throw error;
    }
  }

  // Get card by ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, cu.name as customer_name, cu.email as customer_email
        FROM cards c
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE c.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding card by ID:', error);
      throw error;
    }
  }

  // Get all cards
  static async findAll() {
    try {
      const query = `
        SELECT c.*, cu.name as customer_name, cu.email as customer_email
        FROM cards c
        LEFT JOIN customers cu ON c.customer_id = cu.id
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all cards:', error);
      throw error;
    }
  }

  // Create new card
  static async create(cardData) {
    try {
      const { customer_id, card_number, expiry_date, cvv, card_holder_name, card_type } = cardData;
      const query = `
        INSERT INTO cards (customer_id, card_number, expiry_date, cvv, card_holder_name, card_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [customer_id, card_number, expiry_date, cvv, card_holder_name, card_type];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  // Update card
  static async update(id, cardData) {
    try {
      const { card_number, expiry_date, cvv, card_holder_name, card_type } = cardData;
      const query = `
        UPDATE cards 
        SET card_number = $1, expiry_date = $2, cvv = $3, 
            card_holder_name = $4, card_type = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      const values = [card_number, expiry_date, cvv, card_holder_name, card_type, id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  // Delete card
  static async delete(id) {
    try {
      const query = 'DELETE FROM cards WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  // Get cards by employee (through customers)
  static async findByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT c.*, cu.name as customer_name, cu.email as customer_email
        FROM cards c
        LEFT JOIN customers cu ON c.customer_id = cu.id
        WHERE cu.employee_id = $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding cards by employee ID:', error);
      throw error;
    }
  }
}

module.exports = Card;
