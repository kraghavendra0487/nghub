import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EmployeeSidebar from '../../components/EmployeeSidebar'
import EditCustomerForm from '../../components/employee/EditCustomerForm'
import CardForm from '../../components/employee/CardForm'
import UserCard from '../../components/employee/UserCard'
import ClaimsTable from '../../components/employee/ClaimsTable'
import WhiteCardPopup from '../../components/WhiteCardPopup'

export default function CustomersPage() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
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
  const [searchTerm, setSearchTerm] = useState('')
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
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      // Set empty array to prevent filter errors
      setCustomers([])
    }
  }

  const fetchCustomerCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const cardsByCustomer = {}
      
      // Fetch cards for each customer individually since there's no bulk endpoint
      for (const customer of customers) {
        try {
          const response = await fetch(`/api/customers/${customer.id}/card`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const cardData = await response.json()
            if (cardData.card) {
              cardsByCustomer[customer.id] = cardData.card
            }
          }
        } catch (error) {
          console.error(`Error fetching card for customer ${customer.id}:`, error)
        }
      }
      
      setCustomerCards(cardsByCustomer)
    } catch (error) {
      console.error('Error fetching customer cards:', error)
    }
  }

  const fetchClaims = async () => {
    try {
      // Claims are fetched per card, not globally
      // This will be handled when viewing specific customer claims
      setClaims([])
    } catch (error) {
      console.error('Error fetching claims:', error)
      setClaims([])
    }
  }

  useEffect(() => {
    // User data is now managed by AuthContext
    setLoading(false)
    fetchCustomers()
  }, [])

  // Fetch customer cards after customers are loaded
  useEffect(() => {
    if (customers.length > 0) {
      fetchCustomerCards()
      fetchClaims()
    }
  }, [customers])

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowEditCustomerModal(true)
  }

  const handleDeleteCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowDeleteConfirmModal(true)
  }

  const handleAddCard = (customerId, customerName) => {
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customerName)
    setShowCardForm(true)
  }

  const handleViewCard = (card) => {
      setSelectedCard(card)
      setShowCardModal(true)
  }

  const handleAddClaim = (customerId, customerName) => {
      setSelectedCustomerId(customerId)
    setSelectedCustomerName(customerName)
      setIsAddingClaim(true)
      setShowClaimsModal(true)
  }

  const handleViewClaims = (customerId, customerName) => {
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customerName)
          setIsAddingClaim(false)
          setShowClaimsModal(true)
        }

  const closeEditCustomerModal = () => {
    setShowEditCustomerModal(false)
    setEditingCustomer(null)
  }

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false)
    setEditingCustomer(null)
  }

  const closeCardForm = () => {
    setShowCardForm(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
  }

  const closeCardModal = () => {
    setShowCardModal(false)
    setSelectedCard(null)
  }

  const closeClaimsModal = () => {
    setShowClaimsModal(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
    setIsAddingClaim(false)
  }

  const filteredCustomers = (customers || []).filter(customer =>
    customer && (
      (customer.customer_name && customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone_number && customer.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  )


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
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Customers</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage your customer relationships and track their progress</p>
                  </div>
                    <button
                    onClick={() => navigate('/employee/add-customer')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                    Add Customer
                    </button>
                  </div>
                </div>
                </div>

                {/* Search Bar */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
                  </div>
                </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer) => (
                <UserCard
                  key={customer.id}
                  customer={customer}
                  customerCards={customerCards[customer.id] || []}
                  claims={claims.filter(claim => claim.customer_id === customer.id)}
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onAddCard={handleAddCard}
                  onViewCard={handleViewCard}
                  onAddClaim={handleAddClaim}
                  onViewClaims={handleViewClaims}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>

            {filteredCustomers.length === 0 && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No customers found</h3>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first customer.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                                  <button
                      onClick={() => navigate('/employee/add-customer')}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      Add Customer
                                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
        </main>
      </div>

      {/* Modals */}
      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeEditCustomerModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <EditCustomerForm
              customer={editingCustomer}
              onClose={closeEditCustomerModal}
              onSuccess={() => {
                closeEditCustomerModal()
                fetchCustomers()
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && editingCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeDeleteConfirmModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Customer</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {editingCustomer.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                try {
                  const token = localStorage.getItem('token')
                  const response = await fetch(`/api/customers/${editingCustomer.id}`, {
                      method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                      }
                  })
                  if (response.ok) {
                      closeDeleteConfirmModal()
                    fetchCustomers()
                  }
                } catch (error) {
                    console.error('Error deleting customer:', error)
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Form Modal */}
      {showCardForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeCardForm}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardForm
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
              onClose={closeCardForm}
              onSuccess={() => {
                closeCardForm()
                fetchCustomerCards()
              }}
            />
          </div>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && selectedCard && (
      <WhiteCardPopup 
          card={selectedCard}
        onClose={closeCardModal} 
      />
      )}

      {/* Claims Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeClaimsModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <ClaimsTable
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
              onClose={closeClaimsModal}
              isAddingClaim={isAddingClaim}
              onSuccess={() => {
                      closeClaimsModal()
                fetchClaims()
                    }}
                  />
          </div>
        </div>
      )}
    </div>
  )
}
