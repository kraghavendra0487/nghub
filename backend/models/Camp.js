const pool = require('../config/database');

class Camp {
  // Get all camps
  static async findAll() {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM camps c
        LEFT JOIN users u ON c.employee_id = u.id
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding all camps:', error);
      throw error;
    }
  }

  // Get camp by ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM camps c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding camp by ID:', error);
      throw error;
    }
  }

  // Get camps by employee ID
  static async findByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM camps c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.employee_id = $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding camps by employee ID:', error);
      throw error;
    }
  }

  // Create new camp
  static async create(campData) {
    try {
      const { name, location, start_date, end_date, description, employee_id } = campData;
      const query = `
        INSERT INTO camps (name, location, start_date, end_date, description, employee_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [name, location, start_date, end_date, description, employee_id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating camp:', error);
      throw error;
    }
  }

  // Update camp
  static async update(id, campData) {
    try {
      const { name, location, start_date, end_date, description, employee_id, status } = campData;
      const query = `
        UPDATE camps 
        SET name = $1, location = $2, start_date = $3, end_date = $4, 
            description = $5, employee_id = $6, status = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      const values = [name, location, start_date, end_date, description, employee_id, status, id];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating camp:', error);
      throw error;
    }
  }

  // Delete camp
  static async delete(id) {
    try {
      const query = 'DELETE FROM camps WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting camp:', error);
      throw error;
    }
  }

  // Get camps by status
  static async findByStatus(status) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM camps c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.status = $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      console.error('Error finding camps by status:', error);
      throw error;
    }
  }

  // Search camps
  static async search(searchTerm) {
    try {
      const query = `
        SELECT c.*, u.name as employee_name, u.email as employee_email
        FROM camps c
        LEFT JOIN users u ON c.employee_id = u.id
        WHERE c.name ILIKE $1 OR c.location ILIKE $1 OR c.description ILIKE $1
        ORDER BY c.created_at DESC
      `;
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching camps:', error);
      throw error;
    }
  }
}

module.exports = Camp;
