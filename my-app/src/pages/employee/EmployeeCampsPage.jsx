import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EmployeeSidebar from '../../components/EmployeeSidebar'

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
  const navigate = useNavigate()

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/employee/camps', {
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

  useEffect(() => {
    // User data is now managed by AuthContext
    setLoading(false)
    fetchCamps()
  }, [])


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
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
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
                </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
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
                </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
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
                </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
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
                </div>
              </div>

            {/* Camps List */}
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>All Camps</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                  </div>
                )}

              {camps.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No camps assigned</h3>
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
                          Camp Name
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Location
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Start Date
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          End Date
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {camps.map((camp) => (
                        <tr key={camp.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {camp.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {camp.location}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatDate(camp.start_date)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatDate(camp.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                              {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                              </span>
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
