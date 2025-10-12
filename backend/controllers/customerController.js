const CustomerService = require('../services/customerService');

class CustomerController {
  // Get all customers
  static async getAllCustomers(req, res) {
    try {
      const result = await CustomerService.getAllCustomers();
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting all customers:', error.message);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  // Get customer by ID
  static async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const result = await CustomerService.getCustomerById(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting customer by ID:', error.message);
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch customer' });
      }
    }
  }

  // Get customers by employee ID
  static async getCustomersByEmployeeId(req, res) {
    try {
      const { employeeId } = req.params;
      const result = await CustomerService.getCustomersByEmployeeId(employeeId);
      console.log('🔍 FETCH - Customers for employee', employeeId, ':', result.customers?.length, 'customers');
      console.log('🔍 FETCH - Sample customer:', result.customers?.[0]);
      res.json(result.customers);
    } catch (error) {
      console.error('❌ Error getting customers by employee ID:', error.message);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  // Create customer
  static async createCustomer(req, res) {
    try {
      const customerData = req.body;
      console.log('🔍 CREATE - Request body received:', customerData);
      console.log('🔍 CREATE - referred_person field:', customerData.referred_person);
      const result = await CustomerService.createCustomer(customerData);
      console.log('🔍 CREATE - Result:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error creating customer:', error.message);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  // Update customer
  static async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const customerData = req.body;
      console.log('🔍 UPDATE - Customer ID:', id);
      console.log('🔍 UPDATE - Request body received:', customerData);
      console.log('🔍 UPDATE - referred_person field:', customerData.referred_person);
      const result = await CustomerService.updateCustomer(id, customerData);
      console.log('🔍 UPDATE - Result:', result);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating customer:', error.message);
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update customer' });
      }
    }
  }

  // Delete customer
  static async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const result = await CustomerService.deleteCustomer(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error deleting customer:', error.message);
      if (error.message === 'Customer not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete customer' });
      }
    }
  }

  // Search customers
  static async searchCustomers(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      const result = await CustomerService.searchCustomers(q);
      res.json(result);
    } catch (error) {
      console.error('❌ Error searching customers:', error.message);
      res.status(500).json({ error: 'Failed to search customers' });
    }
  }

  // Get unique work types
  static async getUniqueWorkTypes(req, res) {
    try {
      const result = await CustomerService.getUniqueWorkTypes();
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting unique work types:', error.message);
      res.status(500).json({ error: 'Failed to fetch work types' });
    }
  }
}

module.exports = CustomerController;
