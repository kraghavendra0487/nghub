const db = require('../config/database');

class ServicesDocument {
  // Get all documents for a specific service
  static async findByServiceId(serviceId) {
    console.log('🔍 [SERVICES DOCUMENT MODEL] Finding documents for service ID:', serviceId);
    
    try {
      const query = `
        SELECT 
          sd.*,
          csi.service_name,
          cs.establishment_name
        FROM services_documents sd
        INNER JOIN client_service_items csi ON sd.service_id = csi.id
        INNER JOIN client_services cs ON csi.client_service_id = cs.id
        WHERE sd.service_id = $1
        ORDER BY sd.uploaded_at DESC
      `;
      
      console.log('🔍 [SERVICES DOCUMENT MODEL] Executing query:', query);
      console.log('📊 [SERVICES DOCUMENT MODEL] Query parameter:', serviceId);
      
      const result = await db.query(query, [serviceId]);
      console.log(`📊 [SERVICES DOCUMENT MODEL] Found ${result.rows.length} documents for service ${serviceId}:`, result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('❌ [SERVICES DOCUMENT MODEL] Error finding documents by service ID:', error);
      console.error('❌ [SERVICES DOCUMENT MODEL] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      throw error;
    }
  }

  // Get document by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          sd.*,
          csi.service_name,
          cs.establishment_name
        FROM services_documents sd
        INNER JOIN client_service_items csi ON sd.service_id = csi.id
        INNER JOIN client_services cs ON csi.client_service_id = cs.id
        WHERE sd.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding document by ID:', error);
      throw error;
    }
  }

  // Create new document record
  static async create(documentData) {
    console.log('💾 [SERVICES DOCUMENT MODEL] Creating new document record...');
    console.log('📋 [SERVICES DOCUMENT MODEL] Document data:', documentData);
    
    try {
      const { 
        service_id, 
        document_url, 
        file_name, 
        file_size, 
        mime_type, 
        user_id, 
        created_by 
      } = documentData;
      
      const query = `
        INSERT INTO services_documents (
          service_id, document_url, file_name, file_size, 
          mime_type, user_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        service_id, document_url, file_name, file_size,
        mime_type, user_id, created_by
      ];
      
      console.log('🔍 [SERVICES DOCUMENT MODEL] Executing query:', query);
      console.log('📊 [SERVICES DOCUMENT MODEL] Query values:', values);
      
      const result = await db.query(query, values);
      console.log('✅ [SERVICES DOCUMENT MODEL] Document created successfully:', result.rows[0]);
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ [SERVICES DOCUMENT MODEL] Error creating document:', error);
      console.error('❌ [SERVICES DOCUMENT MODEL] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      throw error;
    }
  }

  // Update document record
  static async update(id, documentData) {
    try {
      const { file_name, file_size, mime_type } = documentData;
      
      const query = `
        UPDATE services_documents 
        SET 
          file_name = $1, 
          file_size = $2, 
          mime_type = $3, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const values = [file_name, file_size, mime_type, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete document record
  static async delete(id) {
    try {
      const query = 'DELETE FROM services_documents WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get all documents with pagination
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, serviceId, userId } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const queryParams = [];
      let paramCount = 0;
      
      if (serviceId) {
        paramCount++;
        whereClause = `WHERE sd.service_id = $${paramCount}`;
        queryParams.push(serviceId);
      }
      
      if (userId) {
        paramCount++;
        whereClause += whereClause ? ` AND sd.user_id = $${paramCount}` : `WHERE sd.user_id = $${paramCount}`;
        queryParams.push(userId);
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM services_documents sd 
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      paramCount++;
      const dataQuery = `
        SELECT 
          sd.*,
          csi.service_name,
          cs.establishment_name,
          cs.employer_name
        FROM services_documents sd
        INNER JOIN client_service_items csi ON sd.service_id = csi.id
        INNER JOIN client_services cs ON csi.client_service_id = cs.id
        ${whereClause}
        ORDER BY sd.uploaded_at DESC
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
      console.error('Error finding all documents:', error);
      throw error;
    }
  }
}

module.exports = ServicesDocument;
