import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../context/AuthContext'
import API_BASE_URL from '../../config/api'

export default function AdminFinancialTransactionsPage() {
  const { user, getAuthHeaders, logout } = useAuth()
  const navigate = useNavigate()

  // Data states
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [bankFilter, setBankFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    bank: '',
    amount: '',
    type: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  // Filter options
  const [banks, setBanks] = useState([])
  const [types] = useState(['Credit', 'Debit'])

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  // Create stable reference for JSX usage
  const isSubmittingRef = useRef(isSubmitting)
  isSubmittingRef.current = isSubmitting

  useEffect(() => {
    if (!user) return

    if (user.role !== 'admin') {
      navigate('/employee', { replace: true })
      return
    }

    fetchTransactions()
    fetchBanks()
  }, [user, navigate, currentPage, limit, searchTerm, bankFilter, typeFilter, startDate, endDate, minAmount, maxAmount])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy: 'transaction_date',
        sortOrder: 'desc'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (bankFilter) params.append('bank', bankFilter)
      if (typeFilter) params.append('type', typeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (minAmount) params.append('minAmount', minAmount)
      if (maxAmount) params.append('maxAmount', maxAmount)

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions?${params.toString()}`, {
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setTransactions(data.data || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(error.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/distinct/bank`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (response.ok) {
        setBanks(data || [])
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const handleAddTransaction = async (e) => {
    e.preventDefault()

    if (isSubmittingRef.current) return

    try {
      setIsSubmitting(true)
      isSubmittingRef.current = true

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newTransaction)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add transaction')
      }

      setSuccess('Transaction added successfully')
      setShowAddModal(false)
      setNewTransaction({
        description: '',
        bank: '',
        amount: '',
        type: '',
        transaction_date: new Date().toISOString().split('T')[0]
      })
      fetchTransactions()
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error adding transaction:', error)
      setError(error.message || 'Failed to add transaction')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()

    if (!uploadFile) {
      setError('Please select a file to upload')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('file', uploadFile)

      // For FormData uploads, only include Authorization header, not Content-Type
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`File processed successfully! ${result.summary?.insertedRows || 0} transactions added.`)
        setShowUploadModal(false)
        setUploadFile(null)
        fetchTransactions()
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(result.error || 'Failed to upload file')
        setTimeout(() => setError(''), 5000)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(`Upload failed: ${error.message}`)
      setTimeout(() => setError(''), 5000)
    } finally {
      setUploading(false)
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

  const formatAmount = (amount) => {
    if (!amount) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setBankFilter('')
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setCurrentPage(1)
  }

  const hasFilters = searchTerm || bankFilter || typeFilter || startDate || endDate || minAmount || maxAmount

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
        {/* Admin Sidebar */}
        <AdminSidebar
          user={user}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900">

            {/* Header */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financial Transactions</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage and track all financial transactions</p>
                  </div>
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
                      onClick={() => setShowAddModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Transaction</span>
                    </button>
                  </div>
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

            {/* Filters */}
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search by description or bank..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Bank Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank
                    </label>
                    <select
                      value={bankFilter}
                      onChange={(e) => setBankFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    >
                      <option value="">All Banks</option>
                      {banks.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    >
                      <option value="">All Types</option>
                      {types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                  {/* Date From */}
                  <div>
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

                  {/* Date To */}
                  <div>
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

                  {/* Min Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Amount
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Max Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Amount
                    </label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {transactions.length} of {totalCount} transactions
                  </div>
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No transactions found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasFilters
                      ? 'Try adjusting your filters to see more results.'
                      : 'Add transactions to get started with financial tracking.'
                    }
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add First Transaction</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Bank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={transaction.description}>
                              {transaction.description || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transaction.bank || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              transaction.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatAmount(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'Credit' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(transaction.transaction_date)}
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
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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

            {/* Add Transaction Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Transaction</h3>
                    <form onSubmit={handleAddTransaction}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmittingRef.current}
                          value={newTransaction.description}
                          onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter transaction description"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank
                        </label>
                        <input
                          type="text"
                          disabled={isSubmittingRef.current}
                          value={newTransaction.bank}
                          onChange={(e) => setNewTransaction({...newTransaction, bank: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter bank name"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          disabled={isSubmittingRef.current}
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Enter amount"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type *
                        </label>
                        <select
                          required
                          disabled={isSubmittingRef.current}
                          value={newTransaction.type}
                          onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select type</option>
                          {types.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction Date *
                        </label>
                        <input
                          type="date"
                          required
                          disabled={isSubmittingRef.current}
                          value={newTransaction.transaction_date}
                          onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                          {isSubmittingRef.current ? 'Adding...' : 'Add Transaction'}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Transaction Data</h3>
                    
                    {/* Loading State */}
                    {uploading && (
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
                    
                    <form onSubmit={handleFileUpload}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select CSV File
                        </label>
                        <input
                          type="file"
                          accept=".csv"
                          required
                          disabled={uploading}
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <p className="font-medium">Required columns:</p>
                          <ul className="list-disc list-inside ml-2">
                            <li>description</li>
                            <li>bank</li>
                            <li>amount</li>
                            <li>type (Credit/Debit)</li>
                            <li>transaction_date (YYYY-MM-DD)</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(false)}
                          disabled={uploading}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploading || !uploadFile}
                          className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white flex items-center space-x-2 ${
                            uploading || !uploadFile
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {uploading ? (
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
