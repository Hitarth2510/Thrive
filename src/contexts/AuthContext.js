import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseHelpers } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session data:', session)
        setUser(session?.user ?? null)
        
        // If no user but we're in demo mode, set demo user
        if (!session?.user) {
          console.log('No session, checking for demo user...')
          const demoUser = await supabaseHelpers.getCurrentUser()
          console.log('Demo user:', demoUser)
          if (demoUser) {
            setUser(demoUser)
            // Set demo restaurant
            setCurrentRestaurant({ id: 'demo-restaurant', name: 'Demo Cafe' })
            console.log('Set demo user and restaurant')
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        // In demo mode, if there's an error, still set demo user
        const demoUser = await supabaseHelpers.getCurrentUser()
        if (demoUser) {
          setUser(demoUser)
          setCurrentRestaurant({ id: 'demo-restaurant', name: 'Demo Cafe' })
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        setUser(session?.user ?? null)
        if (!session?.user) {
          setCurrentRestaurant(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    console.log('SignIn called with:', email, password)
    try {
      const { data, error } = await supabaseHelpers.signIn(email, password)
      console.log('SignIn result:', { data, error })
      if (error) throw error
      
      // Set demo restaurant if in demo mode
      if (data?.user && !currentRestaurant) {
        setCurrentRestaurant({ id: 'demo-restaurant', name: 'Demo Cafe' })
        console.log('Set demo restaurant')
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('SignIn error:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabaseHelpers.signOut()
      if (error) throw error
      setCurrentRestaurant(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    currentRestaurant,
    setCurrentRestaurant,
    signIn,
    signOut,
    isAuthenticated: !!user
  }

  console.log('AuthContext value:', value)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 