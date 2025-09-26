import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

export default function EmployeeDetailsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [employee, setEmployee] = useState(null)
  const [employeeCustomers, setEmployeeCustomers] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }

      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          await Promise.all([fetchEmployee(), fetchEmployeeCustomers()])
        } else {
          navigate('/employee')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('token')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    authenticateUser()
  }, [navigate, id])

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.employee) {
        setEmployee(data.employee)
      } else {
        setError('Employee not found')
        setTimeout(() => navigate('/admin/employees'), 2000)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Failed to fetch employee details')
      setTimeout(() => navigate('/admin/employees'), 2000)
    }
  }

  const fetchEmployeeCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/employees/${id}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.customers) {
        setEmployeeCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching employee customers:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !employee) {
    return null
  }

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('authState')
    
    // Force redirect to login page
    window.location.href = '/login'
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex h-screen">
        {/* Admin Navbar */}
        <AdminSidebar 
          user={user} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-screen">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            
            {/* Header */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigate('/admin/employees')}
                      className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      ← Back to Employees
                    </button>
                    <div>
                      <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Employee Details - {employee.name}
                      </h1>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        Employee ID: {employee.employee_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Mobile menu button is now handled by AdminSidebar */}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Employee Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Employee Details */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Employee Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {employee.name}
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Employee ID:</span> {employee.employee_id}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {employee.email}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {employee.contact}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(employee.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Performance Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
                      {employeeCustomers.length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-600'}`}>
                      Total Customers
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-green-600'}`}>
                      ₹{employeeCustomers.reduce((sum, customer) => sum + (parseFloat(customer.discussed_amount) || 0), 0).toLocaleString()}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-green-600'}`}>
                      Total Discussed Amount
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Assigned Customers ({employeeCustomers.length})
                </h2>
              </div>
              
              {employeeCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Customer
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Contact
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Work Type
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Amounts
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {employeeCustomers.map((customer) => (
                        <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {customer.customer_name?.charAt(0).toUpperCase() || 'C'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {customer.customer_name || 'N/A'}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ID: {customer.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {customer.phone_number || 'N/A'}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {customer.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.type_of_work === 'Interior' 
                                ? 'bg-purple-100 text-purple-800' 
                                : customer.type_of_work === 'Exterior'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.type_of_work || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <span className="font-medium">Discussed:</span> ₹{parseFloat(customer.discussed_amount || 0).toLocaleString()}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className="font-medium">Pending:</span> ₹{parseFloat(customer.pending_amount || 0).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigate(`/admin/customers?highlight=${customer.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                    No customers assigned
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    This employee doesn't have any customers assigned yet.
                  </p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
