import { useState, useEffect, useCallback } from 'react'
import { authManager, UserData } from '../utils/auth'
import { apiService } from '../services/api'

interface UseAuthReturn {
  isAuthenticated: boolean
  user: UserData | null
  login: (phoneNum: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  updateUser: (userData: Partial<UserData>) => void
  loading: boolean
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = authManager.isAuthenticated()
        setIsAuthenticated(authenticated)
        
        if (authenticated) {
          const userData = authManager.getUserData()
          setUser(userData)
          
          // Try to refresh user data from API
          try {
            const response = await apiService.getMyProfile()
            const updatedUser: UserData = {
              id: response.id,
              name: response.name,
              phoneNum: response.phoneNum,
              city: response.city,
              district: response.district,
              lat: response.lat,
              lng: response.lng
            }
            authManager.setUserData(updatedUser)
            setUser(updatedUser)
          } catch (error) {
            console.error('Failed to refresh user data:', error)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        authManager.clearAuth()
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (phoneNum: string, password: string) => {
    try {
      const response = await apiService.login(phoneNum, password)
      
      authManager.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      })
      
      authManager.setUserData(response.user)
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authManager.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const success = await authManager.refreshAccessToken()
      if (!success) {
        setIsAuthenticated(false)
        setUser(null)
      }
      return success
    } catch (error) {
      console.error('Token refresh error:', error)
      setIsAuthenticated(false)
      setUser(null)
      return false
    }
  }, [])

  const updateUser = useCallback((userData: Partial<UserData>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      authManager.setUserData(updatedUser)
      setUser(updatedUser)
    }
  }, [user])

  return {
    isAuthenticated,
    user,
    login,
    logout,
    refreshToken,
    updateUser,
    loading
  }
}