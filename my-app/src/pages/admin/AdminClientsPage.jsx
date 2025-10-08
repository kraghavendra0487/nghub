import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import { useAuth } from '../../context/AuthContext'
import API_BASE_URL from '../../config/api'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminClientsPage() {
  const { user, getAuthHeaders, logout } = useAuth()
  const navigate = useNavigate()
  const isEmployee = user?.role === 'employee'

  // State management
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Debounced search values (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  // Form states
  const [newClient, setNewClient] = useState({
    establishment_name: '',
    employer_name: '',
    email_id: '',
    mobile_number: ''
  })

  const [editClient, setEditClient] = useState({
    establishment_name: '',
    employer_name: '',
    email_id: '',
    mobile_number: ''
  })

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create stable reference for JSX usage
  const isSubmittingRef = useRef(isSubmitting)
  isSubmittingRef.current = isSubmitting

  // --- useEffect: early-return and trigger fetch ---
  useEffect(() => {
    if (!user) return

    // If search exists but is shorter than 3 chars, show no results and skip server call.
    if (debouncedSearchTerm && debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 3) {
      setClients([])
      setTotalCount(0)
      setTotalPages(1)
      setLoading(false)
      return
    }

    fetchClients()
  }, [user, navigate, page, limit, debouncedSearchTerm, startDate, endDate, sortBy, sortOrder])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder
      })

      // Universal search (min 3 chars) - searches establishment, employer, email, and phone
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
        params.append('search', debouncedSearchTerm)
      }

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`${API_BASE_URL}/api/client-services?${params.toString()}`, {
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch clients')
      }

      setClients(data.data || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setError(error.message || 'Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (e) => {
    e.preventDefault()

    if (isSubmittingRef.current) return // Prevent multiple submissions

    try {
      setIsSubmitting(true)
      isSubmittingRef.current = true
      const response = await fetch(`${API_BASE_URL}/api/client-services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newClient)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add client')
      }

      setSuccess('Client added successfully')
      setShowAddModal(false)
      setNewClient({
        establishment_name: '', employer_name: '', email_id: '', mobile_number: ''
      })
      fetchClients()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error adding client:', error)
      setError(error.message || 'Failed to add client')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setEditClient({
      contact_person: client.contact_person,
      contact_number: client.contact_number,
      index: client.index || '',
      establishment_name: client.establishment_name || '',
      employer_name: client.employer_name || '',
      email_id: client.email_id || '',
      mobile_number: client.mobile_number || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateClient = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(`${API_BASE_URL}/api/client-services/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editClient)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }

      setSuccess('Client updated successfully')
      setShowEditModal(false)
      setEditingClient(null)
      fetchClients()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating client:', error)
      setError(error.message || 'Failed to update client')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated services.')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/client-services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setSuccess('Client deleted successfully')
        fetchClients()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete client')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      setError('Failed to delete client')
      setTimeout(() => setError(''), 3000)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleUploadCSV = async (e) => {
    e.preventDefault()
    
    // Get the file input element properly
    const fileInput = e.target.querySelector('input[type="file"]')
    const file = fileInput.files[0]

    console.log('📁 File selected:', file)

    if (!file) {
      setError('Please select a file to upload')
      setTimeout(() => setError(''), 3000)
      return
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const allowedExtensions = ['.csv', '.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)')
      setTimeout(() => setError(''), 5000)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      console.log('📁 Starting upload...')
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })

      const formData = new FormData()
      formData.append('file', file)

      console.log('📁 FormData created, sending request...')

      // For FormData uploads, only include Authorization header, not Content-Type
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      // Don't set Content-Type - let browser set it with boundary for FormData
      
      const response = await fetch(`${API_BASE_URL}/api/client-services/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      })

      console.log('📁 Response received:', response.status, response.statusText)

      const result = await response.json()
      console.log('📁 Response data:', result)

      if (response.ok) {
        setSuccess(`✅ File processed successfully! ${result.summary?.insertedRows || 0} clients added.`)
        setShowUploadModal(false)
        fetchClients()
        setTimeout(() => setSuccess(''), 5000)
      } else {
        console.error('📁 Upload failed:', result)
        let errorMessage = result.error || 'Failed to upload file'
        
        // If it's a column error, make it more user-friendly
        if (errorMessage.includes('Missing required columns')) {
          errorMessage = `❌ Column Error: ${errorMessage}\n\nRequired columns: establishment_name, employer_name, email_id, mobile_number`
        }
        
        setError(errorMessage)
        setTimeout(() => setError(''), 8000) // Show longer for column errors
      }
    } catch (error) {
      console.error('📁 Error uploading file:', error)
      setError(`Upload failed: ${error.message}`)
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      console.log('Exporting with params:', params.toString())

      const response = await fetch(`${API_BASE_URL}/api/client-services/export?${params.toString()}`, {
        headers: getAuthHeaders()
      })

      console.log('Export response status:', response.status)

      if (response.ok) {
        const blob = await response.blob()
        console.log('Export blob size:', blob.size)
        
        if (blob.size > 0) {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'client_services.csv'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          setSuccess('Client data exported successfully!')
          setTimeout(() => setSuccess(''), 3000)
        } else {
          setError('No data to export')
          setTimeout(() => setError(''), 3000)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Export error:', errorData)
        setError(errorData.error || 'Failed to export data')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      setError('Failed to export data')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortBy('created_at')
    setSortOrder('desc')
    setPage(1)
  }

  const hasFilters = (debouncedSearchTerm && debouncedSearchTerm.length >= 3)
    || startDate || endDate || sortBy !== 'created_at' || sortOrder !== 'desc'

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        {isEmployee ? (
          <EmployeeSidebar
            user={user}
            onLogout={logout}
            sidebarOpen={false}
            setSidebarOpen={() => {}}
          />
        ) : (
          <AdminSidebar
            user={user}
            onLogout={logout}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900">

            {/* Header */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">HR Services</h1>
                    <p className="text-sm text-gray-600 mt-1">{isEmployee ? 'View clients and manage services' : 'Manage client information and view associated services'}</p>
                  </div>
                  {!isEmployee && (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload CSV</span>
                      </button>
                      <button
                        onClick={handleExport}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                          loading
                            ? 'bg-purple-400 cursor-not-allowed text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <span>{loading ? 'Exporting...' : 'Export CSV'}</span>
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Client</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
                <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
                <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
              </div>
            )}

            {/* Enhanced Filters */}
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-end gap-6">
                  {/* Universal Search */}
                  <div className="flex-1 max-w-[420px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                      {searchTerm && searchTerm.length < 3 && (
                        <span className="text-xs text-orange-500 ml-2">(Type {3 - searchTerm.length} more chars)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone... (min 3 chars)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Date From - 15% smaller */}
                  <div className="w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Date To - 15% smaller */}
                  <div className="w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Sort By */}
                  <div className="w-[160px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    >
                      <option value="created_at">Date Added</option>
                      <option value="establishment_name">Establishment</option>
                      <option value="employer_name">Employer</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="w-[140px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>

                  {/* Clear Button */}
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm whitespace-nowrap h-[42px]"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex items-center justify-end space-x-6">
                  <div className="text-sm text-gray-600">
                    Showing {clients.length} of {totalCount} clients
                  </div>
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                </div>
              </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {clients.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No clients found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasFilters
                      ? 'Try adjusting your filters to see more results.'
                      : 'Add clients to get started with service management.'
                    }
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add First Client</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-16">
                          #
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">
                          Establishment
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">
                          Employer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Mobile
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-48">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client, index) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-700">
                              {(page - 1) * limit + index + 1}
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-[180px] break-words line-clamp-2">
                              {client.establishment_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-900 max-w-[180px] break-words line-clamp-2">
                              {client.employer_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {client.mobile_number || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-[165px] truncate" title={client.email_id}>
                              {client.email_id || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatTimestamp(client.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/admin/client-services/${client.id}`)}
                                className="bg-teal-600 hover:bg-teal-700 text-white p-1.5 rounded text-xs transition-colors"
                                title="View Services"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                                </svg>
                              </button>
                              {!isEmployee && (
                                <>
                                  <button
                                    onClick={() => handleEditClient(client)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded text-xs transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded text-xs transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 10, 15, 25, 50].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Add Client Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Client</h3>
                    <form onSubmit={handleAddClient}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Establishment Name *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmittingRef.current}
                          value={newClient.establishment_name}
                          onChange={(e) => setNewClient({...newClient, establishment_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter establishment name"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employer Name
                        </label>
                        <input
                          type="text"
                          disabled={isSubmittingRef.current}
                          value={newClient.employer_name}
                          onChange={(e) => setNewClient({...newClient, employer_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter employer name"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          disabled={isSubmittingRef.current}
                          value={newClient.mobile_number}
                          onChange={(e) => setNewClient({...newClient, mobile_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter mobile number"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email ID
                        </label>
                        <input
                          type="email"
                          disabled={isSubmittingRef.current}
                          value={newClient.email_id}
                          onChange={(e) => setNewClient({...newClient, email_id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingRef.current}
                          className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                            isSubmittingRef.current
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isSubmittingRef.current ? 'Adding...' : 'Add Client'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Client Modal */}
            {showEditModal && editingClient && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Client</h3>
                    <form onSubmit={handleUpdateClient}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Establishment Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editClient.establishment_name}
                          onChange={(e) => setEditClient({...editClient, establishment_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employer Name
                        </label>
                        <input
                          type="text"
                          value={editClient.employer_name}
                          onChange={(e) => setEditClient({...editClient, employer_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={editClient.mobile_number}
                          onChange={(e) => setEditClient({...editClient, mobile_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email ID
                        </label>
                        <input
                          type="email"
                          value={editClient.email_id}
                          onChange={(e) => setEditClient({...editClient, email_id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Update Client
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Upload CSV Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Client Data</h3>
                    
                    {/* Loading State */}
                    {loading && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                          <div>
                            <p className="text-sm font-medium text-blue-800">Uploading file...</p>
                            <p className="text-xs text-blue-600">Please wait while we process your file</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleUploadCSV}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select CSV/Excel File
                        </label>
                        <input
                          type="file"
                          name="file"
                          accept=".csv,.xlsx,.xls"
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <p className="font-medium">Required columns:</p>
                          <ul className="list-disc list-inside ml-2">
                            <li>establishment_name</li>
                            <li>employer_name</li>
                            <li>email_id</li>
                            <li>mobile_number</li>
                          </ul>
                          <p className="mt-1">Supported formats: CSV, XLS, XLSX</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(false)}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white flex items-center space-x-2 ${
                            loading
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span>Upload File</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
