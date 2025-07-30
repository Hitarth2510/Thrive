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

  // Add a timeout to force loading to false if it takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ AuthContext: Timeout reached - forcing loading to false')
      setLoading(false)
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    console.log('🔄 AuthContext: useEffect triggered')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...')
        setLoading(true) // Explicitly set loading to true
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📊 AuthContext: Session data:', session?.user?.email || 'no session')
        console.log('📊 AuthContext: Session error:', sessionError)
        
        if (session?.user) {
          console.log('✅ AuthContext: User session found, fetching profile...')
          const userWithProfile = await supabaseHelpers.getCurrentUser()
          console.log('👤 AuthContext: User profile loaded:', userWithProfile?.profile?.role || 'no profile')
          setUser(userWithProfile)
          
          // Set restaurant based on user role
          if (userWithProfile?.profile) {
            if (userWithProfile.profile.role === 'master_admin') {
              console.log('🏢 AuthContext: Setting master admin (no specific restaurant)')
              setCurrentRestaurant(null)
            } else {
              console.log('🏢 AuthContext: Setting restaurant for user:', userWithProfile.profile.restaurant?.name)
              setCurrentRestaurant(userWithProfile.profile.restaurant)
            }
          } else {
            console.warn('⚠️ AuthContext: No profile found for user')
            setCurrentRestaurant(null)
          }
        } else {
          console.log('❌ AuthContext: No session found')
          // If no user but we're in demo mode, set demo user
          console.log('🎭 AuthContext: Checking for demo user...')
          const demoUser = await supabaseHelpers.getCurrentUser()
          console.log('🎭 AuthContext: Demo user result:', demoUser?.email || 'no demo user')
          if (demoUser) {
            setUser(demoUser)
            // Set demo restaurant
            setCurrentRestaurant({ id: 'demo-restaurant', name: 'Demo Cafe' })
            console.log('🎭 AuthContext: Set demo user and restaurant')
          }
        }
      } catch (error) {
        console.error('💥 AuthContext: Error getting session:', error)
        // In demo mode, if there's an error, still set demo user
        try {
          const demoUser = await supabaseHelpers.getCurrentUser()
          if (demoUser) {
            setUser(demoUser)
            setCurrentRestaurant({ id: 'demo-restaurant', name: 'Demo Cafe' })
          }
        } catch (demoError) {
          console.error('💥 AuthContext: Demo user fallback also failed:', demoError)
        }
      } finally {
        console.log('🏁 AuthContext: Setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state change:', event, session?.user?.email || 'no user')
        
        if (session?.user) {
          console.log('✅ AuthContext: User signed in, fetching profile...')
          try {
            const userWithProfile = await supabaseHelpers.getCurrentUser()
            console.log('👤 AuthContext: User profile loaded:', userWithProfile?.profile?.role || 'no profile')
            setUser(userWithProfile)
            
            // Set restaurant based on user role
            if (userWithProfile?.profile) {
              if (userWithProfile.profile.role === 'master_admin') {
                console.log('🏢 AuthContext: Setting master admin - no specific restaurant')
                setCurrentRestaurant(null)
              } else {
                console.log('🏢 AuthContext: Setting restaurant for user:', userWithProfile.profile.restaurant?.name)
                setCurrentRestaurant(userWithProfile.profile.restaurant)
              }
            } else {
              console.warn('⚠️ AuthContext: No profile found for user, setting to null')
              setCurrentRestaurant(null)
            }
          } catch (error) {
            console.error('💥 AuthContext: Error in auth state change:', error)
            // Still set the user even if profile fetch fails
            setUser(session.user)
            setCurrentRestaurant(null)
          }
        } else {
          console.log('❌ AuthContext: User signed out')
          setUser(null)
          setCurrentRestaurant(null)
        }
        console.log('🏁 AuthContext: Auth state change - setting loading to false')
        setLoading(false)
      }
    )

    return () => {
      console.log('🧹 AuthContext: Cleanup - unsubscribing from auth changes')
      subscription.unsubscribe()
    }
  }, [])

  // Unified signIn function with fallback for missing/incomplete user profiles
  const signIn = async (email, password) => {
    try {
      console.log('🔵 AuthContext.signIn: Starting login process for:', email)
      
      // Use supabaseHelpers for sign in (handles demo/real mode)
      const { data, error } = await supabaseHelpers.signIn(email, password);
      
      if (error) {
        console.error('🔴 AuthContext.signIn: Login error:', error);
        return { success: false, error: error.message || error };
      }
      
      if (!data?.user) {
        console.error('🔴 AuthContext.signIn: No user data received');
        return { success: false, error: 'No user data received' };
      }
      
      console.log('🟢 AuthContext.signIn: Login successful for user:', data.user.id);
      
      // The auth state change listener will handle setting the user
      // So we just return success here
      return { success: true };
      
    } catch (err) {
      console.error('🔴 AuthContext.signIn: Login exception:', err);
      return {
        success: false,
        error: err.message || 'Login failed. Please try again.',
      };
    }
  };

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

  // Helper function to check user roles
  const hasRole = (requiredRole) => {
    return supabaseHelpers.hasRole(user?.profile, requiredRole)
  }

  // Helper function to check if user is master admin
  const isMasterAdmin = () => {
    return user?.profile?.role === 'master_admin'
  }

  // Helper function to check if user is admin or higher
  const isAdmin = () => {
    return hasRole('admin')
  }

  const value = {
    user,
    loading,
    currentRestaurant,
    setCurrentRestaurant,
    login: signIn,  // Export signIn as login for compatibility
    signIn,
    signOut,
    isAuthenticated: !!user,
    hasRole,
    isMasterAdmin,
    isAdmin,
    userRole: user?.profile?.role || null
  }

  console.log('AuthContext value:', value)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}