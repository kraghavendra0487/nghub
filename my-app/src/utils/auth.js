// Auth utility functions
export const logout = () => {
  try {
    // Clear all localStorage
    localStorage.clear()
    
    // Use a small delay before redirect to ensure state is cleared
    setTimeout(() => {
      window.location.replace('/')
    }, 100)
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: force reload
    window.location.reload()
  }
}

export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem('token')
    return !!token
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem('token')
  } catch (error) {
    console.error('Get token error:', error)
    return null
  }
}

export const setToken = (token) => {
  try {
    localStorage.setItem('token', token)
  } catch (error) {
    console.error('Set token error:', error)
  }
}

export const removeToken = () => {
  try {
    localStorage.removeItem('token')
  } catch (error) {
    console.error('Remove token error:', error)
  }
}
