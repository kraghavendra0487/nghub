import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import EditCustomerForm from '../../components/employee/EditCustomerForm'
import CardForm from '../../components/employee/CardForm'
import ClaimsTable from '../../components/employee/ClaimsTable'
import PendingPaymentsTable from '../../components/employee/PendingPaymentsTable'
import PendingClaimsTable from '../../components/employee/PendingClaimsTable'
import UserCard from '../../components/employee/UserCard'
import WhiteCardPopup from '../../components/WhiteCardPopup'

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [customerCount, setCustomerCount] = useState(0)
  const [camps, setCamps] = useState([])
  const [upcomingCamps, setUpcomingCamps] = useState([])
  const [completedCamps, setCompletedCamps] = useState([])
  const [cancelledCamps, setCancelledCamps] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCardForm, setShowCardForm] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [isAddingClaim, setIsAddingClaim] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [claims, setClaims] = useState([])
  const [customerCards, setCustomerCards] = useState({})
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false)
  const [showPendingClaimsModal, setShowPendingClaimsModal] = useState(false)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [summaryStats, setSummaryStats] = useState({
    discussedAmountCount: 0,
    pendingAmountCount: 0,
    paidAmountCount: 0,
    totalDiscussedAmount: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0
  })
  const [claimTypeStats, setClaimTypeStats] = useState({})
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
      const data = await response.json()
        const customersData = data.customers || data || []
        setCustomers(customersData)
        setCustomerCount(customersData.length)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      // Set empty arrays to prevent filter errors
      setCustomers([])
      setCustomerCount(0)
    }
  }

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
        const completed = (campsData || []).filter(camp => camp && camp.status === 'completed')
        const cancelled = (campsData || []).filter(camp => camp && camp.status === 'cancelled')
        
        setUpcomingCamps(upcoming)
        setCompletedCamps(completed)
        setCancelledCamps(cancelled)
      }
    } catch (error) {
      console.error('Error fetching camps:', error)
      // Set empty arrays to prevent filter errors
      setCamps([])
      setUpcomingCamps([])
      setCompletedCamps([])
      setCancelledCamps([])
    }
  }

  useEffect(() => {
    // User data is now managed by AuthContext
    setLoading(false)
          fetchCustomers()
          fetchCamps()
  }, [])


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
            {/* Dashboard Overview */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Welcome back, {user?.name}!</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Here's what's happening with your customers today.</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Customers</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{customerCount}</p>
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
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed Camps</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{completedCamps.length}</p>
                    </div>
                  </div>
                </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming Camps</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{upcomingCamps.length}</p>
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
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled Camps</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cancelledCamps.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Activity</h2>
              <div className="text-center py-8">
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent activity to display</p>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
