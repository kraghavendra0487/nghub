const ClientService = require('../models/ClientService');

class ClientServiceController {
  // Get all client services
  static async getAllClientServices(req, res) {
    try {
      // Check if this is a request for clients (with pagination) or services (flat array)
      const { page, limit, search, phoneStartsWith, startDate, endDate, sortBy, sortOrder, serviceCountFilter } = req.query;
      
      if (page || limit || search || startDate || endDate) {
        // This is a request from AdminClientsPage - return paginated clients
        const options = {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          search: search || '',
          phoneStartsWith: phoneStartsWith || '',
          startDate: startDate || '',
          endDate: endDate || '',
          sortBy: sortBy || 'created_at',
          sortOrder: sortOrder || 'desc',
          serviceCountFilter: serviceCountFilter || 'all'
        };
        
        const result = await ClientService.findAllClients(options);
        res.json(result);
      } else {
        // This is a request from AdminServicesPage - return flat services array
        const services = await ClientService.findAll();
        res.json(services);
      }
    } catch (error) {
      console.error('Error getting all client services:', error.message);
      res.status(500).json({ error: 'Failed to fetch client services' });
    }
  }

  // Get client service by ID
  static async getClientServiceById(req, res) {
    try {
      const { id } = req.params;
      const service = await ClientService.findById(id);
      
      if (!service) {
        return res.status(404).json({ error: 'Client service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('❌ Error getting client service by ID:', error.message);
      res.status(500).json({ error: 'Failed to fetch client service' });
    }
  }

  // Create new client service
  static async createClientService(req, res) {
    try {
      const serviceData = {
        ...req.body,
        created_by: req.user.id
      };
      const service = await ClientService.create(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error('❌ Error creating client service:', error.message);
      res.status(500).json({ error: 'Failed to create client service' });
    }
  }

  // Update client service
  static async updateClientService(req, res) {
    try {
      const { id } = req.params;
      const serviceData = req.body;
      const service = await ClientService.update(id, serviceData);
      
      if (!service) {
        return res.status(404).json({ error: 'Client service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('❌ Error updating client service:', error.message);
      res.status(500).json({ error: 'Failed to update client service' });
    }
  }

  // Delete client service
  static async deleteClientService(req, res) {
    try {
      const { id } = req.params;
      const service = await ClientService.delete(id);
      
      if (!service) {
        return res.status(404).json({ error: 'Client service not found' });
      }
      
      res.json({ message: 'Client service deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting client service:', error.message);
      res.status(500).json({ error: 'Failed to delete client service' });
    }
  }

  // Get service statuses
  static async getServiceStatuses(req, res) {
    try {
      const statuses = ['approved', 'rejected', 'pending'];
      res.json(statuses);
    } catch (error) {
      console.error('❌ Error getting service statuses:', error.message);
      res.status(500).json({ error: 'Failed to fetch service statuses' });
    }
  }

  // Get service item by ID
  static async getServiceItemById(req, res) {
    try {
      const { id } = req.params;
      const service = await ClientService.findServiceItemById(id);
      
      if (!service) {
        return res.status(404).json({ error: 'Service item not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('❌ Error getting service item by ID:', error.message);
      res.status(500).json({ error: 'Failed to fetch service item' });
    }
  }

  // Get client services (service items for a specific client)
  static async getClientServices(req, res) {
    try {
      const { id } = req.params;
      const service = await ClientService.findById(id);
      
      if (!service) {
        return res.status(404).json({ error: 'Client service not found' });
      }
      
      res.json(service.service_items || []);
    } catch (error) {
      console.error('❌ Error getting client services:', error.message);
      res.status(500).json({ error: 'Failed to fetch client services' });
    }
  }

  // Add client service (service item)
  static async addClientService(req, res) {
    try {
      const { id } = req.params;
      const serviceData = {
        ...req.body,
        client_service_id: id,
        created_by: req.user.id
      };
      
      const service = await ClientService.addServiceItem(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error('❌ Error adding client service:', error.message);
      res.status(500).json({ error: 'Failed to add client service' });
    }
  }

  // Update service item
  static async updateServiceItem(req, res) {
    try {
      const { id } = req.params;
      const serviceData = req.body;
      
      const service = await ClientService.updateServiceItem(id, serviceData);
      
      if (!service) {
        return res.status(404).json({ error: 'Service item not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('❌ Error updating service item:', error.message);
      res.status(500).json({ error: 'Failed to update service item' });
    }
  }

  // Delete service item
  static async deleteServiceItem(req, res) {
    try {
      const { id } = req.params;
      const service = await ClientService.deleteServiceItem(id);
      
      if (!service) {
        return res.status(404).json({ error: 'Service item not found' });
      }
      
      res.json({ message: 'Service item deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting service item:', error.message);
      res.status(500).json({ error: 'Failed to delete service item' });
    }
  }
}

module.exports = ClientServiceController;