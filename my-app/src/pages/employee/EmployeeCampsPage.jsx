import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import RecentCampsMaps from '../../components/RecentCampsMaps'

export default function CampsPage() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [camps, setCamps] = useState([])
  const [upcomingCamps, setUpcomingCamps] = useState([])
  const [ongoingCamps, setOngoingCamps] = useState([])
  const [completedCamps, setCompletedCamps] = useState([])
  const [cancelledCamps, setCancelledCamps] = useState([])
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('planned')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [employees, setEmployees] = useState([])
  const navigate = useNavigate()

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!user?.id) return
      const response = await fetch(`/api/camps/employee/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const campsData = data.camps || data || []
        setCamps(campsData)
        
        // Filter camps by status with null checks
        const upcoming = (campsData || []).filter(camp => camp && camp.status === 'planned')
        const ongoing = (campsData || []).filter(camp => camp && camp.status === 'ongoing')
        const completed = (campsData || []).filter(camp => camp && camp.status === 'completed')
        const cancelled = (campsData || []).filter(camp => camp && camp.status === 'cancelled')
        
        setUpcomingCamps(upcoming)
        setOngoingCamps(ongoing)
        setCompletedCamps(completed)
        setCancelledCamps(cancelled)
      } else {
        setError('Failed to fetch camps')
      }
    } catch (error) {
      console.error('Error fetching camps:', error)
      setError('Error fetching camps')
      // Set empty arrays to prevent filter errors
      setCamps([])
      setUpcomingCamps([])
      setOngoingCamps([])
      setCompletedCamps([])
      setCancelledCamps([])
    }
  }

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const employeesData = data.users || data.employees || data || []
        setEmployees(employeesData)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchCamps()
      fetchEmployees()
    }
    setLoading(false)
  }, [user])


  const getStatusColor = (status) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getActiveTabData = () => {
    switch(activeTab) {
      case 'planned': return upcomingCamps
      case 'ongoing': return ongoingCamps
      case 'completed': return completedCamps
      case 'cancelled': return cancelledCamps
      default: return upcomingCamps
    }
  }

  const getTabLabel = (status) => {
    switch(status) {
      case 'planned': return 'Upcoming'
      case 'ongoing': return 'Ongoing'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getTabCount = (status) => {
    switch(status) {
      case 'planned': return upcomingCamps.length
      case 'ongoing': return ongoingCamps.length
      case 'completed': return completedCamps.length
      case 'cancelled': return cancelledCamps.length
      default: return 0
    }
  }

  const activeTabData = getActiveTabData()
  const totalPages = Math.ceil(activeTabData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = activeTabData.slice(startIndex, startIndex + itemsPerPage)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const getAssignedEmployeeNames = (assignedToArray) => {
    if (!assignedToArray || !Array.isArray(assignedToArray) || assignedToArray.length === 0) {
      return []
    }
    
    return assignedToArray
      .map(userId => {
        const employee = employees.find(emp => emp.id.toString() === userId.toString())
        return employee ? employee.name : null
      })
      .filter(name => name !== null)
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex h-screen">
        {/* Employee Navbar */}
        <EmployeeSidebar 
          user={user} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-screen">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {/* Header */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Camps</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage and track your assigned camps</p>
                  </div>
                  </div>
                </div>
              </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button
                onClick={() => handleTabChange('planned')}
                className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${
                  activeTab === 'planned' ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{upcomingCamps.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('ongoing')}
                className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${
                  activeTab === 'ongoing' ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ongoing</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ongoingCamps.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('completed')}
                className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${
                  activeTab === 'completed' ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{completedCamps.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('cancelled')}
                className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 transition-all hover:shadow-md ${
                  activeTab === 'cancelled' ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cancelledCamps.length}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Filtered Camps Cards */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-8`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                {getTabLabel(activeTab)} Camps ({getTabCount(activeTab)})
              </h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    No {getTabLabel(activeTab).toLowerCase()} camps
                  </h3>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    You don't have any {getTabLabel(activeTab).toLowerCase()} camps assigned yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Camp Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {paginatedData.map((camp) => (
                      <div key={camp.id} className={`bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden max-w-sm mx-auto`}>
                        <div className="relative">
                          <a href={camp.location_link || `https://www.google.com/maps/search/${encodeURIComponent(camp.location)}`} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                            <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                              <iframe 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                loading="lazy" 
                                allowFullScreen 
                                referrerPolicy="no-referrer-when-downgrade" 
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(camp.location)}&z=15&output=embed`} 
                                title="Camp Location Map" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                            </div>
                          </a>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-1">{camp.location}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(camp.camp_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                              {camp.status?.charAt(0).toUpperCase() + camp.status?.slice(1)}
                            </span>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conducted by</p>
                              <p className="text-gray-800">{camp.conducted_by || 'Not specified'}</p>
                            </div>
                            {camp.phone_number && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
                                <p className="text-gray-800">{camp.phone_number}</p>
                              </div>
                            )}
                            
                            {/* Assigned Employees */}
                            {(() => {
                              const assignedNames = getAssignedEmployeeNames(camp.assigned_to)
                              return assignedNames.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Members</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {assignedNames.map((name, index) => (
                                      <span 
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <a href={camp.location_link || `https://www.google.com/maps/search/${encodeURIComponent(camp.location)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">Open map</a>
                            <span className="text-xs text-gray-400">ID: {camp.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, activeTabData.length)} of {activeTabData.length} camps
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm font-medium rounded-md ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Recent Camps with Maps */}
            <div className="mb-8">
              <RecentCampsMaps camps={camps} title="Recent Camps" onViewMore={() => {}} />
            </div>

            {/* All My Camps Table */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                All My Camps ({camps.length})
              </h2>
              
              {camps.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    No camps assigned
                  </h3>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    You don't have any camps assigned yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Camp Date
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Location
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Conducted By
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Contact
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Status
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {camps.map((camp) => (
                        <tr key={camp.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(camp.camp_date)}
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            <div className="max-w-xs">
                              <p className="truncate">{camp.location}</p>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {camp.conducted_by || 'N/A'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {camp.phone_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                              {camp.status?.charAt(0).toUpperCase() + camp.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => window.open(camp.location_link, '_blank')}
                              disabled={!camp.location_link}
                              className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              View Map
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
