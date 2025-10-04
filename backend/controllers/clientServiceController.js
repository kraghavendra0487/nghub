const { ClientService, ClientServiceItem } = require('../models/ClientService');
const pool = require('../config/database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { spawn } = require('child_process');

// Predefined services list
const PREDEFINED_SERVICES = [
  'Labour Licence Registration',
  'Trade Licence Registration',
  'Food Licence Registration',
  'GST Registration'
];

// Predefined status options
const PREDEFINED_STATUSES = [
  'Not Started',
  'In Progress',
  'Under Review',
  'Completed',
  'Cancelled'
];

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel', // for .xls files
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // for .xlsx files
      'application/csv',
      'text/plain'
    ];
    
    // Check by MIME type or file extension
    const isValidMimeType = allowedTypes.includes(file.mimetype);
    const isValidExtension = file.originalname.toLowerCase().endsWith('.csv') || 
                           file.originalname.toLowerCase().endsWith('.xlsx') || 
                           file.originalname.toLowerCase().endsWith('.xls');
    
    if (isValidMimeType || isValidExtension) {
      console.log(`✅ File accepted: ${file.originalname} (MIME: ${file.mimetype})`);
      return cb(null, true);
    }
    
    console.log(`❌ File rejected: ${file.originalname} (MIME: ${file.mimetype})`);
    return cb(new Error('Only CSV and XLS/XLSX files are allowed'), false);
  }
});

// CSV Parsing Function using Python script
function parseCSVWithPython(filePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../scripts/client_csv_parser.py');
    console.log(`🐍 Executing Python script: ${pythonScript} with file: ${filePath}`);
    
    const python = spawn('python', [pythonScript, filePath]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      console.log(`🐍 Python script finished with code: ${code}`);
      
      if (code !== 0) {
        console.error(`🐍 Python script error: ${stderr}`);
        resolve({ success: false, error: stderr || 'Python script execution failed' });
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        console.log('🐍 Python script result:', result);
        resolve(result);
      } catch (parseError) {
        console.error('🐍 Error parsing Python script output:', parseError);
        console.log('🐍 Raw stdout:', stdout);
        resolve({ success: false, error: 'Failed to parse Python script output' });
      }
    });
    
    python.on('error', (error) => {
      console.error('🐍 Python script spawn error:', error);
      resolve({ success: false, error: `Failed to execute Python script: ${error.message}` });
    });
  });
}

// Parse XLSX file
async function parseXLSX(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return { success: false, error: 'Excel file is empty or invalid' };
    }

    // Validate required columns
    const requiredColumns = ['establishment_name', 'employer_name', 'email_id', 'mobile_number'];
    const firstRow = jsonData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        details: `Required columns: ${requiredColumns.join(', ')}`
      };
    }

    // Validate and clean data
    const validData = [];
    const errors = [];

    jsonData.forEach((row, index) => {
      const rowErrors = [];
      
      // Basic validation
      if (!row.establishment_name || row.establishment_name.toString().trim() === '') {
        rowErrors.push('Establishment name is required');
      }
      if (!row.employer_name || row.employer_name.toString().trim() === '') {
        rowErrors.push('Employer name is required');
      }
      if (!row.email_id || row.email_id.toString().trim() === '') {
        rowErrors.push('Email ID is required');
      }
      if (!row.mobile_number || row.mobile_number.toString().trim() === '') {
        rowErrors.push('Mobile number is required');
      }

      if (rowErrors.length === 0) {
        validData.push({
          establishment_name: row.establishment_name.toString().trim(),
          employer_name: row.employer_name.toString().trim(),
          email_id: row.email_id.toString().trim(),
          mobile_number: row.mobile_number.toString().trim()
        });
      } else {
        errors.push({
          row: index + 1,
          errors: rowErrors,
          data: row
        });
      }
    });

    return {
      success: true,
      data: validData,
      errors: errors
    };

  } catch (error) {
    console.error('Error parsing XLSX file:', error);
    return { success: false, error: error.message };
  }
}


class ClientServiceController {
  // Upload CSV or XLS file and bulk create client services
  static async uploadCSVorXLS(req, res) {
    try {
      console.log('📁 Upload request received');
      console.log('📁 Request body keys:', Object.keys(req.body || {}));
      console.log('📁 Request files:', req.files);
      console.log('📁 Request file:', req.file);
      console.log('📁 Content-Type:', req.headers['content-type']);
      
      // Check for multer errors first
      if (req.fileValidationError) {
        console.log('❌ Multer validation error:', req.fileValidationError);
        return res.status(400).json({
          success: false,
          error: req.fileValidationError
        });
      }
      
      if (!req.file) {
        console.log('❌ No file uploaded');
        console.log('❌ Request body:', req.body);
        console.log('❌ Request files:', req.files);
        return res.status(400).json({
          success: false,
          error: 'No file uploaded. Please select a CSV or Excel file.'
        });
      }

      console.log('📁 req.file:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      });

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      console.log(`📁 CSV file uploaded to: ${filePath}`);

      let parsedData = null;

      // Parse file based on extension (CSV or XLSX)
      if (fileExtension === '.csv') {
        // Use Python script for CSV parsing
        parsedData = await parseCSVWithPython(filePath);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Use Node.js library for Excel parsing
        parsedData = await parseXLSX(filePath);
      } else {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid file type. Only CSV or XLSX are allowed' 
        });
      }

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          error: parsedData.error,
          details: parsedData.errors || []
        });
      }

      // Insert valid data into database
      const insertedRecords = [];
      const insertionErrors = [];

      for (let i = 0; i < parsedData.data.length; i++) {
        try {
          const record = await ClientService.create(parsedData.data[i]);
          insertedRecords.push(record);
        } catch (insertError) {
          insertionErrors.push({
            row: i + 1,
            data: parsedData.data[i],
            error: insertError.message
          });
        }
      }

      // Response with operation summary
      res.json({
        success: true,
        message: 'Client data file processed successfully',
        summary: {
          totalRows: parsedData.data.length,
          insertedRows: insertedRecords.length,
          insertionErrors: insertionErrors.length,
          validationErrors: parsedData.errors ? parsedData.errors.length : 0
        },
        details: {
          insertionErrors,
          validationErrors: parsedData.errors || []
        }
      });

      // Clean up the uploaded file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    } catch (error) {
      console.error('❌ Error processing client data file upload:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process client data file upload',
        details: error.message
      });
    }
  }

  // Export client services to CSV
  static async exportToCSV(req, res) {
    try {
      console.log('📊 Export CSV request received');
      console.log('Request URL:', req.url);
      console.log('Request method:', req.method);
      console.log('Request headers:', req.headers);
      
      const {
        search = '',
        startDate = '',
        endDate = ''
      } = req.query;

      console.log('Export request with params:', { search, startDate, endDate });

      const options = {
        search,
        startDate,
        endDate
      };

      const clients = await ClientService.findAllForExport(options);
      
      console.log(`📊 Exporting ${clients.length} client records`);
      
      if (clients.length === 0) {
        console.log('No clients found to export');
        // Still return a CSV with headers
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="client_services.csv"');
        res.send('ID,Establishment Name,Employer Name,Email ID,Mobile Number,Created At,Updated At\n');
        return;
      }
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="client_services.csv"');
      
      // Create CSV content with proper escaping
      const csvHeader = 'ID,Establishment Name,Employer Name,Email ID,Mobile Number,Created At,Updated At\n';
      const csvRows = clients.map(record => {
        const escapeCSV = (str) => {
          if (str === null || str === undefined) return '';
          const strValue = String(str);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        };
        
        return [
          record.id || '',
          escapeCSV(record.establishment_name),
          escapeCSV(record.employer_name),
          escapeCSV(record.email_id),
          escapeCSV(record.mobile_number),
          escapeCSV(record.created_at),
          escapeCSV(record.updated_at)
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      console.log(`📊 CSV content length: ${csvContent.length} characters`);
      
      res.send(csvContent);
    } catch (error) {
      console.error('❌ Error exporting client services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export client services',
        details: error.message
      });
    }
  }

  // Get all client services with pagination and filtering
  static async getAllClientServices(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search = '',
        startDate,
        endDate
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        startDate,
        endDate
      };

      const result = await ClientService.findAllWithServiceCounts(options);
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting all client services:', error.message);
      res.status(500).json({ error: 'Failed to fetch client services' });
    }
  }

  // Get client service by ID with service items
  static async getClientServiceById(req, res) {
    try {
      const { id } = req.params;
      const result = await ClientService.findByIdWithServices(id);

      if (!result) {
        return res.status(404).json({ error: 'Client service not found' });
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Error getting client service by ID:', error.message);
      res.status(500).json({ error: 'Failed to fetch client service' });
    }
  }

  // Create client service (simplified structure)
  static async createClientService(req, res) {
    try {
      const {
        establishment_name, employer_name, email_id, mobile_number
      } = req.body;

      if (!establishment_name) {
        return res.status(400).json({ error: 'Establishment name is required' });
      }

      const clientServiceData = {
        establishment_name, employer_name, email_id, mobile_number
      };
      const result = await ClientService.create(clientServiceData);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error creating client service:', error.message);
      res.status(500).json({ error: 'Failed to create client service' });
    }
  }


  // Update client service (simplified structure)
  static async updateClientService(req, res) {
    try {
      const { id } = req.params;
      const {
        establishment_name, employer_name, email_id, mobile_number
      } = req.body;

      if (!establishment_name) {
        return res.status(400).json({ error: 'Establishment name is required' });
      }

      const clientServiceData = {
        establishment_name, employer_name, email_id, mobile_number
      };
      const result = await ClientService.update(id, clientServiceData);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating client service:', error.message);
      if (error.message === 'Client service not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update client service' });
      }
    }
  }

  // Delete client service
  static async deleteClientService(req, res) {
    try {
      const { id } = req.params;
      const result = await ClientService.delete(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error deleting client service:', error.message);
      if (error.message === 'Client service not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete client service' });
      }
    }
  }

  // ===== SERVICE ITEM MANAGEMENT METHODS =====

  // Get all service items for a client
  static async getServiceItems(req, res) {
    try {
      const { clientServiceId } = req.params;
      const serviceItems = await ClientServiceItem.findByClientServiceId(clientServiceId);
      res.json(serviceItems);
    } catch (error) {
      console.error('❌ Error getting service items:', error.message);
      res.status(500).json({ error: 'Failed to fetch service items' });
    }
  }

  // Create new service item
  static async createServiceItem(req, res) {
    try {
      const { clientServiceId } = req.params;
      const { service_name, service_status, remarks } = req.body;

      if (!service_name) {
        return res.status(400).json({ error: 'Service name is required' });
      }

      const serviceItemData = {
        client_service_id: clientServiceId,
        service_name,
        service_status,
        remarks
      };

      const result = await ClientServiceItem.create(serviceItemData);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error creating service item:', error.message);
      res.status(500).json({ error: 'Failed to create service item' });
    }
  }

  // Update service item
  static async updateServiceItem(req, res) {
    try {
      const { id } = req.params;
      const { service_name, service_status, remarks } = req.body;

      if (!service_name) {
        return res.status(400).json({ error: 'Service name is required' });
      }

      const serviceItemData = { service_name, service_status, remarks };
      const result = await ClientServiceItem.update(id, serviceItemData);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating service item:', error.message);
      if (error.message === 'Service item not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update service item' });
      }
    }
  }

  // Delete service item
  static async deleteServiceItem(req, res) {
    try {
      const { id } = req.params;
      const result = await ClientServiceItem.delete(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error deleting service item:', error.message);
      if (error.message === 'Service item not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete service item' });
      }
    }
  }

  // Get distinct values for filter dropdowns (basic client info only)
  static async getDistinctValues(req, res) {
    try {
      const { column } = req.params;
      const result = await ClientService.getDistinctValues(column);
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting distinct values:', error.message);
      res.status(500).json({ error: 'Failed to fetch distinct values' });
    }
  }

  // Get predefined service statuses for dropdowns
  static async getServiceStatuses(req, res) {
    try {
      res.json(PREDEFINED_STATUSES);
    } catch (error) {
      console.error('❌ Error getting service statuses:', error.message);
      res.status(500).json({ error: 'Failed to fetch service statuses' });
    }
  }

  // Get predefined services list for dropdowns
  static async getAvailableServices(req, res) {
    try {
      res.json(PREDEFINED_SERVICES);
    } catch (error) {
      console.error('❌ Error getting available services:', error.message);
      res.status(500).json({ error: 'Failed to fetch available services' });
    }
  }

}

module.exports = { ClientServiceController, upload };
