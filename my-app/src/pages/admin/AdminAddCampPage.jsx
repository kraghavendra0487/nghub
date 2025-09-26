import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

export default function AddCampPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState({
    camp_date: '',
    location: '',
    location_link: '',
    phone_number: '',
    status: 'planned',
    conducted_by: '',
    assigned_to: []
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

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
          fetchEmployees()
        } else {
          navigate('/employee') // Redirect if not admin
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
  }, [navigate])

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filter out admin users, only show employees
        const employeeOnly = (data.employees || []).filter((emp) => emp.role === 'employee')
        setEmployees(employeeOnly)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'assigned_to') {
      // Handle multiple selection
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
      setFormData({ ...formData, [name]: selectedOptions })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (formData.assigned_to.length === 0) {
      setError('Please select at least one employee to assign the camp to')
      setSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      // Convert assigned_to array to PostgreSQL array format
      const campData = {
        ...formData,
        assigned_to: formData.assigned_to // Send as JSON array, let backend handle conversion
      }
      
      console.log('Sending camp data:', campData)
      console.log('assigned_to format:', campData.assigned_to)
      
      const response = await fetch('/api/camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Camp added successfully!')
        // Reset form
        setFormData({
          camp_date: '',
          location: '',
          location_link: '',
          phone_number: '',
          status: 'planned',
          conducted_by: '',
          assigned_to: []
        })
        setTimeout(() => {
          navigate('/admin/camps') // Redirect back to camp management
        }, 2000)
      } else {
        setError(data.error || 'Failed to add camp')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
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
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Camp</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Schedule a new camp in the system</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigate('/admin/camps')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Back to Camps
                    </button>
                  </div>
                </div>
              </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="camp_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Camp Date *
                </label>
                <input
                  type="date"
                  id="camp_date"
                  name="camp_date"
                  value={formData.camp_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter camp location"
              />
            </div>

            <div>
              <label htmlFor="location_link" className="block text-sm font-medium text-gray-700 mb-1">
                Location Link
              </label>
              <input
                type="url"
                id="location_link"
                name="location_link"
                value={formData.location_link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter contact phone number"
              />
            </div>

            <div>
              <label htmlFor="conducted_by" className="block text-sm font-medium text-gray-700 mb-1">
                Conducted By *
              </label>
              <input
                type="text"
                id="conducted_by"
                name="conducted_by"
                value={formData.conducted_by}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter conductor name"
              />
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Employees (Multiple Selection)
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                multiple
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                size="4"
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple employees</p>
              {formData.assigned_to.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {formData.assigned_to.length} employee(s) selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              style={{ backgroundColor: '#fcb72d' }}
            >
              {submitting ? 'Adding Camp...' : 'Add Camp'}
            </button>
          </form>
        </div>
          </div>
        </main>
      </div>
    </div>
  )
}
