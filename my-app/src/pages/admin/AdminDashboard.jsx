import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../context/AuthContext'
import API_BASE_URL from '../../config/api'

export default function AdminDashboard() {
  const { user, getAuthHeaders, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [camps, setCamps] = useState([])
  const [cards, setCards] = useState([])
  const [claims, setClaims] = useState([])
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [upcomingPageSize] = useState(5)
  const navigate = useNavigate()

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/employees`, { headers: getAuthHeaders() })
      const data = await response.json()
      const list = Array.isArray(data) ? data : (data.users || data.employees || [])
      setEmployees(list)
    } catch (error) {
      setError('Failed to fetch employees')
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, { headers: getAuthHeaders() })
      const data = await response.json()
      const list = Array.isArray(data) ? data : (data.customers || [])
      setCustomers(list)
    } catch (error) {
      setError('Failed to fetch customers')
    }
  }

  const fetchCamps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/camps`, { headers: getAuthHeaders() })
      const data = await response.json()
      const list = Array.isArray(data) ? data : (data.camps || [])
      setCamps(list)
    } catch (error) {
      setError('Failed to fetch camps')
    }
  }

  const fetchCards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cards`, { headers: getAuthHeaders() })
      const data = await response.json()
      const fromData = data && (data.cards || data.data || data.list || data)
      const list = Array.isArray(fromData) ? fromData : (fromData ? [fromData] : [])
      setCards(list)
    } catch (error) {
      setError('Failed to fetch cards')
    }
  }

  const fetchClaims = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claims`, { headers: getAuthHeaders() })
      const data = await response.json()
      const list = Array.isArray(data) ? data : (data.claims || [])
      setClaims(list)
    } catch (error) {
      setError('Failed to fetch claims')
    }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    if (user.role !== 'admin') { navigate('/employee', { replace: true }); return }
    Promise.all([fetchEmployees(), fetchCustomers(), fetchCamps(), fetchCards(), fetchClaims()])
      .finally(() => setLoading(false))
  }, [user, navigate])

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

  const employeesCount = employees.length
  const employeesActive = employees.filter(emp => emp.role === 'employee').length
  const totalCustomers = customers.length
  const totalCards = cards.length
  const totalClaims = claims.length
  const toNumber = (v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  const totalRevenue = customers.reduce((sum, c) => sum + toNumber(c.discussed_amount), 0)
  const totalDiscussed = customers.reduce((sum, c) => sum + toNumber(c.discussed_amount), 0)
  const pendingCustomerPayments = customers.reduce((sum, c) => sum + toNumber(c.pending_amount), 0)
  const pendingClaimsAmount = claims.filter(cl => (cl.status || '').toLowerCase() === 'pending').reduce((s, cl) => s + toNumber(cl.amount), 0)
  const completedCamps = camps.filter(c => (c.status || '').toLowerCase() === 'completed')
  const plannedCamps = camps.filter(c => (c.status || '').toLowerCase() === 'planned')
  const ongoingCamps = camps.filter(c => (c.status || '').toLowerCase() === 'ongoing')
  const pendingCampsCount = plannedCamps.length + ongoingCamps.length

  const byDateDesc = (a, b) => new Date(b.camp_date) - new Date(a.camp_date)
  const byDateAsc = (a, b) => new Date(a.camp_date) - new Date(b.camp_date)
  const recentCamps = [...camps].sort(byDateDesc).slice(0, 4)
  const today = new Date(); today.setHours(0,0,0,0)
  const upcoming = camps.filter(c => { const d = new Date(c.camp_date); d.setHours(0,0,0,0); return d >= today }).sort(byDateAsc)
  const totalUpcomingPages = Math.max(1, Math.ceil(upcoming.length / upcomingPageSize))
  const currentUpcomingPage = Math.min(upcomingPage, totalUpcomingPages)
  const upcomingSlice = upcoming.slice((currentUpcomingPage - 1) * upcomingPageSize, currentUpcomingPage * upcomingPageSize)

  const sortByCreatedDesc = (list) => [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  const recentEmployees = sortByCreatedDesc(employees).slice(0, 10)
  const recentCustomers = sortByCreatedDesc(customers).slice(0, 10)

  const handleLogout = () => logout()

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
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Admin Dashboard</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Welcome back, {user?.name}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Mobile menu button is now handled by AdminSidebar */}
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                  {error}
                  <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
              )}
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[
                { label: 'Employees', value: `${employeesActive} / ${employeesCount}`, border: 'border-blue-500', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
                { label: 'Customers', value: totalCustomers.toLocaleString(), border: 'border-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
                { label: 'Cards', value: totalCards.toLocaleString(), border: 'border-violet-500', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
                { label: 'Claims', value: totalClaims.toLocaleString(), border: 'border-pink-500', iconBg: 'bg-pink-100', iconText: 'text-pink-600' },
                { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, border: 'border-yellow-500', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
                { label: 'Pending Cust. Payments', value: `₹${pendingCustomerPayments.toLocaleString()}`, border: 'border-orange-500', iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
                { label: 'Pending Claims Amount', value: `₹${pendingClaimsAmount.toLocaleString()}`, border: 'border-red-500', iconBg: 'bg-red-100', iconText: 'text-red-600' },
                { label: 'Discussed Amount', value: `₹${totalDiscussed.toLocaleString()}`, border: 'border-amber-500', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
                { label: 'Pending Camps', value: pendingCampsCount.toLocaleString(), border: 'border-cyan-500', iconBg: 'bg-cyan-100', iconText: 'text-cyan-600' },
                { label: 'Completed Camps', value: completedCamps.length.toLocaleString(), border: 'border-slate-500', iconBg: 'bg-slate-100', iconText: 'text-slate-600' }
              ].map((kpi, idx) => (
                <div key={idx} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 ${kpi.border}`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${kpi.iconBg}`}>
                      <svg className={`w-6 h-6 ${kpi.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{kpi.label}</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Camps Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Camps</h2>
                </div>
                <div className="space-y-3">
                  {recentCamps.map((camp) => (
                    <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between`}>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{camp.location}</p>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{new Date(camp.camp_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        (camp.status || '').toLowerCase() === 'completed' ? 'bg-gray-100 text-gray-800' :
                        (camp.status || '').toLowerCase() === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {(camp.status || '').charAt(0).toUpperCase() + (camp.status || '').slice(1)}
                      </span>
                    </div>
                  ))}
                  {recentCamps.length === 0 && (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No recent camps.</p>
                  )}
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Upcoming Camps</h2>
                  <div className="space-x-2">
                    <button onClick={() => setUpcomingPage(p => Math.max(1, p - 1))} className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded disabled:opacity-50`} disabled={currentUpcomingPage === 1}>Prev</button>
                    <button onClick={() => setUpcomingPage(p => Math.min(totalUpcomingPages, p + 1))} className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded disabled:opacity-50`} disabled={currentUpcomingPage === totalUpcomingPages}>Next</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {upcomingSlice.map((camp) => (
                    <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between`}>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{camp.location}</p>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{new Date(camp.camp_date).toLocaleDateString()}</p>
                      </div>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(camp.location)}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Map</a>
                    </div>
                  ))}
                  {upcomingSlice.length === 0 && (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No upcoming camps.</p>
                  )}
                </div>
                <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Page {currentUpcomingPage} of {totalUpcomingPages}</div>
              </div>
            </div>

            {/* Recent joins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Employees</h2>
                  <button onClick={() => navigate('/admin/employees')} className="text-sm text-blue-600 hover:underline">View more</button>
                </div>
                <div className="space-y-3">
                  {recentEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between">
                      <div>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{emp.name}</p>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{emp.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{emp.role}</span>
                    </div>
                  ))}
                  {recentEmployees.length === 0 && (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No employees found.</p>
                  )}
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Customers</h2>
                  <button onClick={() => navigate('/admin/customers')} className="text-sm text-blue-600 hover:underline">View more</button>
                </div>
                <div className="space-y-3">
                  {recentCustomers.map(cust => (
                    <div key={cust.id} className="flex items-center justify-between">
                      <div>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{cust.customer_name}</p>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{cust.email || cust.phone_number}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>ID {cust.id}</span>
                    </div>
                  ))}
                  {recentCustomers.length === 0 && (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No customers found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/admin/add-employee')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Add Employee</h3>
                      <p className="text-sm text-gray-500">Register new employee</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/add-camp')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Add Camp</h3>
                      <p className="text-sm text-gray-500">Schedule new camp</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/employees')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Manage Employees</h3>
                      <p className="text-sm text-gray-500">View all employees</p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            
          </div>
        </main>
      </div>
    </div>
  )
}
