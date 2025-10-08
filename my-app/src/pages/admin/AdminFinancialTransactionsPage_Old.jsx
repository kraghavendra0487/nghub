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
  const isSubmittingRef = useRef(isSubmitting)
  isSubmittingRef.current = isSubmitting

  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, bankFilter, typeFilter, startDate, endDate, minAmount, maxAmount])

  // Fetch data when page or filters change
  useEffect(() => {
    fetchTransactions()
    fetchBanks()
  }, [currentPage, searchTerm, bankFilter, typeFilter, startDate, endDate, minAmount, maxAmount])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(bankFilter && { bank: bankFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount })
      })

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions?${params}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      if (data.success) {
        setTransactions(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.totalCount || 0)
      } else {
        setTransactions([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(error.message || 'Failed to fetch transactions')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/distinct/bank`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setBanks(data.data)
        } else {
          setBanks([])
        }
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
      setBanks([])
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
      setError('Please select a CSV file')
      setTimeout(() => setError(''), 3000)
      return
    }

    console.log('🚀 Upload button clicked, file selected:', uploadFile.name)

    try {
      setUploading(true)
      setError('')
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      console.log('📤 Frontend: Uploading file:', uploadFile.name, uploadFile.type, uploadFile.size)
      console.log('📤 Frontend: FormData entries:', Array.from(formData.entries()))

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/upload`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          'Authorization': getAuthHeaders()['Authorization'] // Only include auth header
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle detailed error messages from Python script
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.slice(0, 5).join('\n') // Show first 5 errors
          const moreErrors = data.details.length > 5 ? `\n... and ${data.details.length - 5} more errors` : ''
          throw new Error(`${data.error}\n\nDetails:\n${errorMessages}${moreErrors}`)
        } else if (data.details) {
          throw new Error(`${data.error}\n\nDetails: ${data.details}`)
        } else {
          throw new Error(data.error || 'Failed to upload CSV file')
        }
      }

      // Show success message with summary
      let successMessage = data.message || 'CSV uploaded successfully'
      if (data.summary) {
        successMessage += `\n\nSummary:\n• Total rows processed: ${data.summary.totalRows}\n• Successfully inserted: ${data.summary.insertedRows}`
        if (data.summary.errors > 0) {
          successMessage += `\n• Errors found: ${data.summary.errors}`
        }
      }

      setSuccess(successMessage)
      setShowUploadModal(false)
      setUploadFile(null)
      fetchTransactions()
      setTimeout(() => setSuccess(''), 8000) // Show longer for detailed messages
    } catch (error) {
      console.error('Error uploading CSV:', error)
      setError(error.message || 'Failed to upload CSV file')
      setTimeout(() => setError(''), 10000) // Show longer for detailed error messages
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(bankFilter && { bank: bankFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount })
      })

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/export?${params}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'financial_transactions.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('Data exported successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
      setError(error.message || 'Failed to export data')
      setTimeout(() => setError(''), 3000)
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleUploadCSV = async (e) => {
    e.preventDefault()
    if (!uploadFile) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch(`${API_BASE_URL}/api/financial-transactions/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully uploaded ${data.insertedRows} transactions`)
        setUploadFile(null)
        setShowUploadModal(false)
        fetchTransactions() // Refresh the list
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex h-screen">
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
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
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-60"></div>
                      <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-2xl">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent tracking-tight">
                        Advanced Filters
                      </h2>
                      <p className="text-slate-300 text-lg font-medium">Enterprise-grade transaction management & analytics</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-slate-700/50 rounded-2xl px-6 py-3 border border-slate-600/30">
                      <div className="w-3 h-3 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50"></div>
                      <span className="text-slate-300 font-medium">Smart Filters</span>
                    </div>
                  </div>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-10">
                  {/* Search */}
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Global Search
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full px-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all duration-300 placeholder-slate-400 shadow-xl hover:shadow-2xl text-slate-100 font-medium"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank Filter */}
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Banking Partner
                    </label>
                    <select
                      value={bankFilter}
                      onChange={(e) => setBankFilter(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-2xl appearance-none cursor-pointer text-slate-100 font-medium"
                    >
                      <option value="">All Banking Partners</option>
                      {Array.isArray(banks) && banks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Transaction Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all duration-300 shadow-xl hover:shadow-2xl appearance-none cursor-pointer text-slate-100 font-medium"
                    >
                      <option value="">All Transaction Types</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date Range
                    </label>
                    <div className="space-y-4">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400 transition-all duration-300 shadow-xl hover:shadow-2xl text-slate-100 font-medium"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400 transition-all duration-300 shadow-xl hover:shadow-2xl text-slate-100 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Minimum Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-amber-400 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all duration-300 placeholder-slate-400 shadow-xl hover:shadow-2xl text-slate-100 font-medium"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Maximum Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-amber-400 font-bold text-lg">₹</span>
                      <input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="999999.99"
                        className="w-full pl-12 pr-6 py-4 bg-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition-all duration-300 placeholder-slate-400 shadow-xl hover:shadow-2xl text-slate-100 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    <div className="relative flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Transaction</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    <div className="relative flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Bulk Upload</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-700 hover:via-violet-700 hover:to-fuchsia-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    <div className="relative flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export Data</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={clearFilters}
                    className="group relative overflow-hidden bg-gradient-to-r from-slate-600 via-gray-700 to-zinc-700 hover:from-slate-700 hover:via-gray-800 hover:to-zinc-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-slate-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                    <div className="relative flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Reset Filters</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
              <div className="relative">
                <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm px-8 py-6 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          Financial Transactions
                        </h3>
                        <p className="text-gray-600 text-sm">{totalCount} records found</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live Updates</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/50">
                    <thead className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
                      <tr>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Date</span>
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Description</span>
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Bank</span>
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>Amount</span>
                          </div>
                        </th>
                        <th className="px-8 py-6 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>Type</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/30">
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.id} className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 hover:shadow-md">
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-semibold text-gray-900 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl shadow-sm border border-gray-200/50">
                                {formatDate(transaction.transaction_date)}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl shadow-sm border border-blue-200/50">
                                {transaction.bank}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className={`text-lg font-bold transition-all duration-200 ${
                              transaction.type === 'Credit' 
                                ? 'text-emerald-600 group-hover:text-emerald-700' 
                                : 'text-red-600 group-hover:text-red-700'
                            }`}>
                              {formatCurrency(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl shadow-sm border transition-all duration-200 ${
                                transaction.type === 'Credit'
                                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 group-hover:from-emerald-200 group-hover:to-green-200'
                                  : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200 group-hover:from-red-200 group-hover:to-rose-200'
                              }`}>
                                <svg className={`w-4 h-4 mr-2 ${
                                  transaction.type === 'Credit' ? 'text-emerald-600' : 'text-red-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                    transaction.type === 'Credit' 
                                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                                      : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                  } />
                                </svg>
                                {transaction.type}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm px-8 py-6 border-t border-gray-200/50">
                    <div className="flex-1 flex justify-between sm:hidden mb-4">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80"
                      >
                        Next
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-700 font-medium">
                          Showing{' '}
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">{(currentPage - 1) * limit + 1}</span>
                          {' '}to{' '}
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                            {Math.min(currentPage * limit, totalCount)}
                          </span>
                          {' '}of{' '}
                          <span className="font-bold text-gray-900 bg-blue-100 px-2 py-1 rounded-lg">{totalCount}</span>
                          {' '}results
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <nav className="relative z-0 inline-flex rounded-xl shadow-sm space-x-1">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                          </button>
                          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                  page === currentPage
                                    ? 'z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                                    : 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-500 hover:bg-gray-50 hover:shadow-md'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          {totalPages > 7 && currentPage < totalPages - 3 && (
                            <span className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500">
                              ...
                            </span>
                          )}
                          {totalPages > 7 && currentPage >= totalPages - 3 && (
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-500 hover:bg-gray-50 hover:shadow-md"
                            >
                              {totalPages}
                            </button>
                          )}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-4 py-2 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80"
                          >
                            Next
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

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
                    placeholder="e.g., GST Registration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmittingRef.current}
                    value={newTransaction.bank}
                    onChange={(e) => setNewTransaction({...newTransaction, bank: e.target.value})}
                    placeholder="e.g., Yes bank"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <option value="">Select Type</option>
                    {types.map(type => (
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
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload CSV File
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleFileUpload}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📁 Select CSV File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      required
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        {uploadFile ? uploadFile.name : 'Click to select CSV file'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">CSV files only</p>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 CSV Format Requirements:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Columns: description, bank, amount, type, transaction_date</li>
                    <li>• Type must be "Credit" or "Debit"</li>
                    <li>• Date format: YYYY-MM-DD</li>
                    <li>• Amount should be numeric</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-all ${
                      uploading || !uploadFile
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                    }`}
                  >
                    {uploading ? '📤 Uploading...' : '📤 Upload CSV'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

