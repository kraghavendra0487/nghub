import { useState, useRef, useEffect } from 'react'

const ServiceDropdown = ({ 
  value, 
  onChange, 
  placeholder = "Select a service...", 
  disabled = false,
  className = "",
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedService, setSelectedService] = useState(value || '')
  const dropdownRef = useRef(null)

  // Predefined service list
  const serviceList = [
    'L.L REG',
    'L.L REN',
    'L.L AMENDMENT',
    'TRADE LICENSE REG',
    'TRADE LICENSE REN',
    'FOOD LICENSE REG',
    'FOOD LICENSE REN',
    'GST REG',
    'INCOME TAX RETURNS',
    'FIRM REG',
    'MSME REG',
    'DSC (Digital Signature)',
    'PERSONAL LOAN',
    'HOME LOAN',
    'BUSINESS LOAN',
    'MORTGAGE LOAN'
  ]

  // Filter services based on search term
  const getFilteredServices = () => {
    if (!searchTerm.trim()) {
      return serviceList
    }
    return serviceList.filter(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Handle service selection
  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setSearchTerm('')
    setShowDropdown(false)
    if (onChange) {
      onChange(service)
    }
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // If user is typing, show dropdown
    if (!showDropdown && value.length > 0) {
      setShowDropdown(true)
    }
    
    // If user clears the input, clear selection
    if (value === '') {
      setSelectedService('')
      if (onChange) {
        onChange('')
      }
    }
  }

  // Handle input focus
  const handleFocus = () => {
    setShowDropdown(true)
  }

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update selected service when value prop changes
  useEffect(() => {
    setSelectedService(value || '')
  }, [value])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Service Name {required && '*'}
      </label>
      <input
        type="text"
        value={showDropdown ? searchTerm : selectedService}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        autoComplete="off"
      />
      
      {/* Dropdown */}
      {showDropdown && !disabled && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {getFilteredServices().length > 0 ? (
            <ul className="py-1">
              {getFilteredServices().map((service, index) => (
                <li
                  key={index}
                  onClick={() => handleServiceSelect(service)}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-gray-800 transition-colors"
                >
                  {service}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matching services found
            </div>
          )}
        </div>
      )}
      
      {/* Clear button */}
      {selectedService && !disabled && (
        <button
          type="button"
          onClick={() => {
            setSelectedService('')
            setSearchTerm('')
            if (onChange) {
              onChange('')
            }
          }}
          className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ServiceDropdown
