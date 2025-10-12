const db = require('../config/database');

class ClientService {
  // Get all client services with their items (for Services page) - shows all services with valid names
  static async findAll() {
    try {
      const query = `
        SELECT 
          cs.id as client_service_id,
          cs.establishment_name,
          cs.employer_name,
          cs.email_id,
          cs.mobile_number,
          cs.created_at as establishment_created_at,
          csi.id as service_item_id,
          csi.service_name,
          csi.service_status,
          csi.remarks,
          csi.created_at as service_created_at,
          csi.updated_at as service_updated_at
        FROM client_services cs
        INNER JOIN client_service_items csi ON cs.id = csi.client_service_id
        WHERE csi.service_name IS NOT NULL 
        AND csi.service_name != ''
        ORDER BY csi.created_at DESC
      `;
      
      const result = await db.query(query);
      
      // Convert to flat array - each row represents a service item
      const flatServices = result.rows.map(row => ({
        id: `${row.client_service_id}-${row.service_item_id}`,
        client_service_id: row.client_service_id,
        establishment_name: row.establishment_name,
        employer_name: row.employer_name,
        email_id: row.email_id,
        mobile_number: row.mobile_number,
        service_name: row.service_name,
        service_status: row.service_status,
        remarks: row.remarks,
        created_at: row.service_created_at,
        updated_at: row.service_updated_at
      }));
      
      return flatServices;
    } catch (error) {
      console.error('Error finding all client services:', error);
      throw error;
    }
  }

  // Get all client establishments (for Clients page) with pagination
  static async findAllClients(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', phoneStartsWith = '', startDate = '', endDate = '', sortBy = 'created_at', sortOrder = 'desc', serviceCountFilter = 'all' } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const queryParams = [];
      let paramCount = 0;
      
      // Build WHERE clause for search
      if (search) {
        paramCount++;
        whereClause += `WHERE (cs.establishment_name ILIKE $${paramCount} OR cs.employer_name ILIKE $${paramCount} OR cs.email_id ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }
      
      // Add phone search condition (prefix match)
      if (phoneStartsWith) {
        paramCount++;
        const phoneCondition = whereClause ? 'AND' : 'WHERE';
        whereClause += ` ${phoneCondition} TRIM(cs.mobile_number) LIKE $${paramCount}`;
        queryParams.push(`${phoneStartsWith}%`);
      }
      
      // Add date filters
      if (startDate) {
        paramCount++;
        const dateCondition = whereClause ? 'AND' : 'WHERE';
        whereClause += ` ${dateCondition} cs.created_at >= $${paramCount}`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        paramCount++;
        const dateCondition = whereClause ? 'AND' : 'WHERE';
        whereClause += ` ${dateCondition} cs.created_at <= $${paramCount}`;
        queryParams.push(endDate);
      }
      
      // Count total records (simplified approach)
      const countQuery = `SELECT COUNT(*) as total FROM client_services cs ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Add service count filter to HAVING clause
      let havingClause = '';
      if (serviceCountFilter !== 'all') {
        switch (serviceCountFilter) {
          case '0':
            havingClause = 'HAVING COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != \'\' THEN csi.id END) = 0';
            break;
          case '1':
            havingClause = 'HAVING COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != \'\' THEN csi.id END) = 1';
            break;
          case '2-5':
            havingClause = 'HAVING COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != \'\' THEN csi.id END) BETWEEN 2 AND 5';
            break;
          case '6-10':
            havingClause = 'HAVING COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != \'\' THEN csi.id END) BETWEEN 6 AND 10';
            break;
          case '10+':
            havingClause = 'HAVING COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != \'\' THEN csi.id END) > 10';
            break;
        }
      }
      
      // Get paginated results
      paramCount++;
      const dataQuery = `
        SELECT 
          cs.id,
          cs.establishment_name,
          cs.employer_name,
          cs.email_id,
          cs.mobile_number,
          cs.created_at,
          cs.updated_at,
          COUNT(CASE WHEN csi.service_name IS NOT NULL AND csi.service_name != '' THEN csi.id END) as service_count
        FROM client_services cs
        LEFT JOIN client_service_items csi ON cs.id = csi.client_service_id
        ${whereClause}
        GROUP BY cs.id, cs.establishment_name, cs.employer_name, cs.email_id, cs.mobile_number, cs.created_at, cs.updated_at
        ${havingClause}
        ORDER BY cs.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: dataResult.rows,
        totalCount,
        totalPages,
        currentPage: page,
        limit
      };
    } catch (error) {
      console.error('Error finding all clients:', error);
      throw error;
    }
  }

  // Get client service by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          cs.*,
          csi.id as service_item_id,
          csi.service_name,
          csi.service_status,
          csi.remarks,
          csi.created_at as service_created_at
        FROM client_services cs
        LEFT JOIN client_service_items csi ON cs.id = csi.client_service_id
        WHERE cs.id = $1
        ORDER BY csi.created_at DESC
      `;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const service = {
        id: result.rows[0].id,
        establishment_name: result.rows[0].establishment_name,
        employer_name: result.rows[0].employer_name,
        email_id: result.rows[0].email_id,
        mobile_number: result.rows[0].mobile_number,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
        service_items: []
      };
      
      result.rows.forEach(row => {
        if (row.service_item_id) {
          service.service_items.push({
            id: row.service_item_id,
            service_name: row.service_name,
            service_status: row.service_status,
            remarks: row.remarks,
            created_at: row.service_created_at
          });
        }
      });
      
      return service;
    } catch (error) {
      console.error('Error finding client service by ID:', error);
      throw error;
    }
  }

  // Create new client service
  static async create(serviceData) {
    try {
      const { establishment_name, employer_name, email_id, mobile_number, created_by } = serviceData;
      const query = `
        INSERT INTO client_services (establishment_name, employer_name, email_id, mobile_number, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [establishment_name, employer_name, email_id, mobile_number, created_by];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating client service:', error);
      throw error;
    }
  }

  // Update client service
  static async update(id, serviceData) {
    try {
      const { establishment_name, employer_name, email_id, mobile_number } = serviceData;
      const query = `
        UPDATE client_services 
        SET establishment_name = $1, employer_name = $2, email_id = $3, mobile_number = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      const values = [establishment_name, employer_name, email_id, mobile_number, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating client service:', error);
      throw error;
    }
  }

  // Delete client service
  static async delete(id) {
    try {
      const query = 'DELETE FROM client_services WHERE id = $1 RETURNING id';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting client service:', error);
      throw error;
    }
  }

  // Add service item to a client service
  static async addServiceItem(serviceItemData) {
    try {
      const { client_service_id, service_name, service_status, remarks, created_by } = serviceItemData;
      const query = `
        INSERT INTO client_service_items (client_service_id, service_name, service_status, remarks, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [client_service_id, service_name, service_status, remarks, created_by];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding service item:', error);
      throw error;
    }
  }

  // Update service item
  static async updateServiceItem(id, serviceItemData) {
    try {
      const { service_name, service_status, remarks } = serviceItemData;
      const query = `
        UPDATE client_service_items 
        SET service_name = $1, service_status = $2, remarks = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      const values = [service_name, service_status, remarks, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating service item:', error);
      throw error;
    }
  }

  // Delete service item
  static async deleteServiceItem(id) {
    try {
      const query = 'DELETE FROM client_service_items WHERE id = $1 RETURNING id';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting service item:', error);
      throw error;
    }
  }

  // Find service item by ID
  static async findServiceItemById(id) {
    try {
      const query = 'SELECT * FROM client_service_items WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding service item by ID:', error);
      throw error;
    }
  }
}

module.exports = ClientService;