const pool = require('../config/database');

class Customer {
  // Get all customers
  static async findAll() {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM customers c
        LEFT JOIN users u ON c.employee_id = u.id
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all customers:', error);
      throw error;
    }
  }

  // Get customer by ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM customers c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      throw error;
    }
  }

  // Get customers by employee ID
  static async findByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM customers c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.employee_id = $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding customers by employee ID:', error);
      throw error;
    }
  }

  // Create new customer
  static async create(customerData) {
    try {
      const { name, email, contact, address, employee_id } = customerData;
      const query = `
        INSERT INTO customers (name, email, contact, address, employee_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [name, email, contact, address, employee_id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  static async update(id, customerData) {
    try {
      const { name, email, contact, address, employee_id } = customerData;
      const query = `
        UPDATE customers 
        SET name = $1, email = $2, contact = $3, address = $4, employee_id = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      const values = [name, email, contact, address, employee_id, id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete customer
  static async delete(id) {
    try {
      const query = 'DELETE FROM customers WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Search customers
  static async search(searchTerm) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM customers c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.contact ILIKE $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
}

module.exports = Customer;
