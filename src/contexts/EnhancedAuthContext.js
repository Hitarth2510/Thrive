import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)

  // Helper to fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          restaurants (
            id,
            name,
            location,
            address,
            phone,
            email
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session data:', session)
        
        if (session?.user) {
          setUser(session.user)
          
          // Fetch user profile
          const profile = await fetchUserProfile(session.user.id)
          if (profile) {
            setUserProfile(profile)
            if (profile.restaurants) {
              setCurrentRestaurant(profile.restaurants)
            }
          }
        } else {
          // Set demo data for development
          console.log('No session, setting demo data...')
          const demoUser = { id: 'demo-user', email: 'demo@example.com' }
          const demoProfile = {
            id: 'demo-user',
            email: 'demo@example.com',
            username: 'demouser',
            full_name: 'Demo User',
            role: 'staff',
            restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
            restaurants: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Demo Cafe',
              location: '123 Main Street',
              address: '123 Main Street, City',
              phone: '+1234567890',
              email: 'demo@cafe.com'
            }
          }
          
          setUser(demoUser)
          setUserProfile(demoProfile)
          setCurrentRestaurant(demoProfile.restaurants)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session)
        
        if (session?.user) {
          setUser(session.user)
          
          // Fetch user profile
          const profile = await fetchUserProfile(session.user.id)
          if (profile) {
            setUserProfile(profile)
            if (profile.restaurants) {
              setCurrentRestaurant(profile.restaurants)
            }
          }
        } else {
          setUser(null)
          setUserProfile(null)
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('SignIn result:', { data, error })
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('SignIn error:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setUserProfile(null)
      setCurrentRestaurant(null)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create new user (for admin creating staff/other admins)
  const createUser = async (userData) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) throw authError

      // Then create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          username: userData.username || userData.email.split('@')[0],
          full_name: userData.full_name,
          role: userData.role,
          restaurant_id: userData.restaurant_id,
        })
        .select()
        .single()

      if (profileError) throw profileError

      return { success: true, data: profileData }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    if (!userProfile) return false
    
    const userRole = userProfile.role
    
    // Role hierarchy
    if (userRole === 'master_admin') return true
    if (role === 'cafe_restaurant_admin' && userRole === 'master_admin') return true
    if (role === 'staff' && ['cafe_restaurant_admin', 'master_admin'].includes(userRole)) return true
    
    return userRole === role
  }

  // Check if user can manage restaurant
  const canManageRestaurant = () => {
    return hasRole('cafe_restaurant_admin') || hasRole('master_admin')
  }

  // Check if user is master admin
  const isMasterAdmin = () => {
    return userProfile?.role === 'master_admin'
  }

  const value = {
    user,
    userProfile,
    currentRestaurant,
    loading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    createUser,
    hasRole,
    canManageRestaurant,
    isMasterAdmin,
    supabase,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
