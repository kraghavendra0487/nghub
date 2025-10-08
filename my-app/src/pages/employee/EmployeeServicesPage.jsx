import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import { useAuth } from '../../context/AuthContext'
import API_BASE_URL from '../../config/api'

export default function EmployeeServicesPage() {
  const { user, getAuthHeaders, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstablishment, setFilterEstablishment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('establishments') // 'establishments' or 'services'
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      return
    }
    if (user.role !== 'employee') {
      navigate('/admin', { replace: true })
      return
    }
    fetchServices()
    setLoading(false)
  }, [user, navigate])

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/client-services`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const servicesData = Array.isArray(data) ? data : (data.services || [])
        setServices(servicesData)
      } else {
        setError('Failed to fetch services')
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setError('Failed to fetch services')
    }
  }

  const getFilteredServices = () => {
    return services.filter(service => {
      // Only show services that have a service_name (no empty services)
      if (!service.service_name || service.service_name.trim() === '') {
        return false
      }
      
      const matchesSearch = !searchTerm || 
        service.establishment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEstablishment = filterEstablishment === 'all' || 
        service.establishment_name === filterEstablishment
      
      const matchesStatus = filterStatus === 'all' || 
        service.service_status === filterStatus
      
      return matchesSearch && matchesEstablishment && matchesStatus
    })
  }

  const getEstablishmentOptions = () => {
    const establishments = [...new Set(services.map(service => service.establishment_name).filter(Boolean))]
    return establishments
  }

  const getStatusOptions = () => {
    const statuses = [...new Set(services.map(service => service.service_status).filter(Boolean))]
    return statuses
  }

  const getUniqueEstablishments = () => {
    const establishmentMap = new Map()
    
    services.forEach(service => {
      const key = service.client_service_id
      if (!establishmentMap.has(key)) {
        establishmentMap.set(key, {
          id: key,
          establishment_name: service.establishment_name,
          employer_name: service.employer_name,
          service_count: 0
        })
      }
      establishmentMap.get(key).service_count++
    })
    
    return Array.from(establishmentMap.values())
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  if (!user) {
    return null
  }

  const handleLogout = () => logout()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Employee Sidebar */}
        <EmployeeSidebar
          user={user}
          onLogout={handleLogout}
          sidebarOpen={false}
          setSidebarOpen={() => {}}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900">
            
            {/* Header */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Services Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {viewMode === 'establishments' 
                        ? 'View establishments with multiple services' 
                        : 'View all services in table format'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setViewMode('establishments')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'establishments'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Establishments
                    </button>
                    <button
                      onClick={() => setViewMode('services')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'services'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Services List
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
                <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
              </div>
            )}

            {/* Filters - Only show for services view */}
            {viewMode === 'services' && (
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                      />
                    </div>

                    {/* Establishment Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Establishment
                      </label>
                      <select
                        value={filterEstablishment}
                        onChange={(e) => setFilterEstablishment(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                      >
                        <option value="all">All Establishments</option>
                        {getEstablishmentOptions().map((establishment) => (
                          <option key={establishment} value={establishment}>
                            {establishment}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                      >
                        <option value="all">All Statuses</option>
                        {getStatusOptions().map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Results Count */}
                    <div className="flex items-end">
                      <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {getFilteredServices().length} services found
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content based on view mode */}
            {viewMode === 'establishments' ? (
              /* Establishments List View */
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    ESTABLISHMENT
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Establishments with multiple services ({getUniqueEstablishments().length} found)
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {getUniqueEstablishments().map((establishment) => (
                    <div 
                      key={establishment.id} 
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/employee/client-services/${establishment.id}`)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {establishment.establishment_name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {establishment.employer_name} • {establishment.service_count} services
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Services Table View */
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Establishment Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredServices().map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {service.establishment_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {service.service_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.service_status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : service.service_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : service.service_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {service.service_status && service.service_status.trim() !== '' 
                                ? service.service_status.charAt(0).toUpperCase() + service.service_status.slice(1) 
                                : 'Not Set'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {service.remarks || 'No remarks'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(service.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(service.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {((viewMode === 'services' && getFilteredServices().length === 0) || 
              (viewMode === 'establishments' && getUniqueEstablishments().length === 0)) && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {viewMode === 'establishments' ? 'No establishments found' : 'No services found'}
                </h3>
                <p className="text-gray-600">
                  {services.length === 0 
                    ? 'No establishments have multiple services yet.' 
                    : viewMode === 'establishments'
                    ? 'No establishments meet the criteria of having multiple services.'
                    : 'Try adjusting your filters to see more results.'
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
