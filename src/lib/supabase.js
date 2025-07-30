import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Check if we're in demo mode (no real Supabase credentials)
const isDemoMode = !supabaseUrl || 
  supabaseUrl === 'your_supabase_project_url' || 
  supabaseUrl === 'https://demo.supabase.co' ||
  !supabaseAnonKey || 
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseAnonKey === 'demo_anon_key' ||
  supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE'

console.log('🔧 Supabase Configuration:')
console.log('  URL:', supabaseUrl)
console.log('  Demo mode:', isDemoMode)
console.log('  Has anon key:', !!supabaseAnonKey)
console.log('  Key preview:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'none')

// Enhanced Supabase client configuration with timeout and retry settings
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-client-info': 'thrive-cafe-billing@1.0.0'
    }
  }
}

// Create a mock client for demo mode with enhanced authentication
const createMockClient = () => ({
  auth: {
    signInWithPassword: async (credentials) => {
      console.log('🎭 Demo Mode: Mock signInWithPassword called with:', credentials.email)
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Demo credentials that always work
      const validEmails = ['admin@thrive.com', 'demo@example.com', 'test@test.com', credentials.email]
      
      if (validEmails.includes(credentials.email)) {
        console.log('🟢 Demo login successful for:', credentials.email)
        return { 
          data: { 
            user: { 
              id: 'demo-user-' + Date.now(), 
              email: credentials.email,
              user_metadata: {
                full_name: 'Demo User',
                role: 'admin'
              }
            },
            session: {
              access_token: 'demo-token-' + Date.now(),
              user: {
                id: 'demo-user-' + Date.now(),
                email: credentials.email
              }
            }
          }, 
          error: null 
        }
      } else {
        console.log('🔴 Demo login failed for:', credentials.email)
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid demo credentials. Try: admin@thrive.com' }
        }
      }
    },
    signOut: async () => {
      console.log('🎭 Demo Mode: Mock signOut called')
      return { error: null }
    },
    getUser: async () => {
      console.log('🎭 Demo Mode: Mock getUser called')
      return { 
        data: { 
          user: { 
            id: 'demo-user', 
            email: 'admin@thrive.com',
            user_metadata: {
              full_name: 'Demo User',
              role: 'admin'
            }
          } 
        },
        error: null 
      }
    },
    getSession: async () => {
      console.log('🎭 Demo Mode: Mock getSession called')
      return { 
        data: { 
          session: {
            user: { 
              id: 'demo-user', 
              email: 'admin@thrive.com',
              user_metadata: {
                full_name: 'Demo User',
                role: 'admin'
              }
            },
            access_token: 'demo-token'
          } 
        },
        error: null 
      }
    },
    onAuthStateChange: (callback) => {
      console.log('🎭 Demo Mode: Mock onAuthStateChange called')
      // Simulate auth state change
      setTimeout(() => {
        callback('SIGNED_IN', { 
          user: { 
            id: 'demo-user', 
            email: 'admin@thrive.com',
            user_metadata: {
              full_name: 'Demo User',
              role: 'admin'
            }
          } 
        })
      }, 100)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        order: (orderBy) => Promise.resolve({ 
          data: demoData[table] || [], 
          error: null 
        }),
        single: () => Promise.resolve({ 
          data: (demoData[table] || [])[0] || null, 
          error: null 
        })
      }),
      order: (orderBy) => Promise.resolve({ 
        data: demoData[table] || [], 
        error: null 
      })
    }),
    insert: (data) => Promise.resolve({ 
      data: [{ ...data, id: Date.now().toString() }], 
      error: null 
    }),
    update: (data) => Promise.resolve({ 
      data: [data], 
      error: null 
    }),
    delete: () => Promise.resolve({ error: null })
  }),
  rpc: (fn, params) => Promise.resolve({ data: [], error: null })
})

export const supabase = isDemoMode ? createMockClient() : createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Database table names
export const TABLES = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  PRODUCTS: 'products',
  COMBOS: 'combos',
  OFFERS: 'offers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  SALES: 'sales',
  DRAFT_ORDERS: 'draft_orders'
}

// Demo data for testing
const demoData = {
  products: [
    { id: '1', name: 'Cappuccino', price: 4.50, making_cost: 1.20, restaurant_id: 'demo-restaurant' },
    { id: '2', name: 'Espresso', price: 3.00, making_cost: 0.80, restaurant_id: 'demo-restaurant' },
    { id: '3', name: 'Latte', price: 4.80, making_cost: 1.50, restaurant_id: 'demo-restaurant' },
    { id: '4', name: 'Americano', price: 3.50, making_cost: 0.90, restaurant_id: 'demo-restaurant' },
    { id: '5', name: 'Mocha', price: 5.20, making_cost: 1.80, restaurant_id: 'demo-restaurant' }
  ],
  combos: [
    { id: '1', name: 'Coffee + Pastry', price: 7.50, making_cost: 2.50, restaurant_id: 'demo-restaurant' },
    { id: '2', name: 'Breakfast Set', price: 12.00, making_cost: 4.00, restaurant_id: 'demo-restaurant' }
  ],
  offers: [
    { id: '1', name: 'Happy Hour', discount_percentage: 10, is_active: true, restaurant_id: 'demo-restaurant' },
    { id: '2', name: 'Student Discount', discount_percentage: 15, is_active: true, restaurant_id: 'demo-restaurant' }
  ],
  sales: [
    { id: '1', total_amount: 45.50, customer_name: 'John Doe', payment_method: 'card', created_at: new Date().toISOString() },
    { id: '2', total_amount: 32.80, customer_name: 'Jane Smith', payment_method: 'cash', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', total_amount: 28.90, customer_name: 'Mike Johnson', payment_method: 'upi', created_at: new Date(Date.now() - 172800000).toISOString() }
  ]
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Network diagnostics helper
  async checkNetworkConnectivity() {
    try {
      console.log('🔧 Checking network connectivity...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log('🟢 Network connectivity: OK')
        return true
      } else {
        console.log('🟡 Network connectivity: Partial')
        return false
      }
    } catch (error) {
      console.log('🔴 Network connectivity: Failed', error.message)
      return false
    }
  },

  // Direct Supabase connectivity test
  async testSupabaseConnection() {
    console.log('🔧 Testing direct Supabase connection...')
    
    if (isDemoMode) {
      return { success: true, message: 'Demo mode - connection simulation successful' }
    }
    
    try {
      // Test 1: Basic RPC call
      console.log('🔧 Test 1: Basic RPC health check...')
      const { error: healthError } = await supabase.rpc('select', {}, {
        count: 'exact'
      })
      
      if (healthError) {
        console.log('🟡 Health check failed, trying alternative...')
      } else {
        console.log('🟢 Health check passed')
      }
      
      // Test 2: Auth service test  
      console.log('🔧 Test 2: Auth service test...')
      const { error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        throw new Error(`Auth service error: ${authError.message}`)
      }
      
      console.log('🟢 Auth service accessible')
      
      // Test 3: Database access test
      console.log('🔧 Test 3: Database access test...')
      const { error: dbError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      if (dbError) {
        console.log('🟡 Database test result:', dbError.message)
        // This might fail due to RLS, which is expected
        if (dbError.message.includes('RLS') || dbError.message.includes('policy')) {
          console.log('🟢 Database accessible (RLS policy rejection expected)')
          return { 
            success: true, 
            message: 'Supabase connection successful. Database and Auth services are accessible.' 
          }
        } else {
          throw new Error(`Database error: ${dbError.message}`)
        }
      }
      
      console.log('🟢 Full connectivity test passed')
      return { 
        success: true, 
        message: 'Supabase connection test passed. All services accessible.' 
      }
      
    } catch (error) {
      console.error('🔴 Supabase connection test failed:', error)
      return { 
        success: false, 
        message: `Connection test failed: ${error.message}` 
      }
    }
  },
  async signIn(email, password) {
    console.log('🔵 supabaseHelpers.signIn called with:', email)
    
    if (isDemoMode) {
      console.log('🎭 Using demo mode for signIn')
      return {
        data: { 
          user: { 
            id: 'demo-user', 
            email: email,
            profile: { role: 'admin', full_name: 'Demo User' }
          } 
        }, 
        error: null 
      }
    }

    // Real Supabase mode - ultra simplified
    console.log('🔵 Using real Supabase for signIn - Ultra simple approach')
    
    try {
      console.log('🔵 Calling supabase.auth.signInWithPassword...')
      
      const result = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })
      
      console.log('🔵 Supabase auth result:', result)
      
      if (result.error) {
        console.error('🔴 Auth error:', result.error)
        return result
      }
      
      if (result.data?.user) {
        console.log('🟢 Auth successful for user:', result.data.user.id)
      }
      
      return result
      
    } catch (error) {
      console.error('🔴 Exception during auth:', error)
      return { 
        data: null, 
        error: { message: error.message } 
      }
    }
  },

  // Individual sign-in attempt with timeout
  async attemptSignIn(email, password, timeout, attemptNumber) {
    console.log(`🔧 Attempting signIn (${attemptNumber}) with ${timeout}ms timeout`)
    
    
    const signinPromise = async () => {
      console.log('🔵 Starting Supabase auth.signInWithPassword...')
      
      // Basic auth call with error handling
      let authResult
      try {
        authResult = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        })
      } catch (authError) {
        console.error('🔴 Direct auth error:', authError)
        throw new Error(`Authentication service error: ${authError.message}`)
      }
      
      const { data, error } = authResult
      
      if (error) {
        console.error('🔴 Supabase auth error:', error)
        throw new Error(`Authentication failed: ${error.message}`)
      }
      
      if (!data?.user) {
        console.error('🔴 No user data returned')
        throw new Error('Authentication failed: No user data received')
      }
      
      console.log('🟢 Auth successful, user:', data.user.id)
      
      // Simplified profile fetching with better error handling
      try {
        const profileResult = await this.fetchUserProfile(data.user.id, 3000) // 3 second timeout for profile
        if (profileResult.profile) {
          data.user.profile = profileResult.profile
          console.log('🟢 Profile attached:', profileResult.profile.role)
        } else {
          console.log('🟡 Profile fetch failed, proceeding without profile')
          // Don't fail the entire login for profile issues
        }
      } catch (profileError) {
        console.log('� Profile fetch error (non-fatal):', profileError.message)
        // Continue without profile - user can still log in
      }
      
      return { data, error: null }
    }
    
    // Directly return the sign-in result without timeout to avoid premature aborts
    return await signinPromise()
  },

  // Separate profile fetching with its own timeout
  async fetchUserProfile(userId, timeout = 3000) {
    console.log('🔵 Fetching user profile for:', userId)
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Profile fetch timeout after ${timeout}ms`)), timeout)
    )
    
    const profilePromise = async () => {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('id', userId)
        .single()
      
      if (profileError) {
        throw new Error(`Profile fetch error: ${profileError.message}`)
      }
      
      return { profile }
    }
    
    try {
      return await Promise.race([profilePromise(), timeoutPromise])
    } catch (error) {
      console.error('🔴 Profile fetch failed:', error.message)
      return { profile: null, error }
    }
  },

  async signOut() {
    console.log('supabaseHelpers.signOut called')
    if (isDemoMode) {
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    console.log('🔍 supabaseHelpers.getCurrentUser called')
    
    // Add timeout wrapper
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getCurrentUser timeout')), 8000)
    )
    
    const getCurrentUserPromise = async () => {
      if (isDemoMode) {
        console.log('🎭 Demo mode detected - returning demo user')
        return { id: 'demo-user', email: 'demo@example.com' }
      }
      
      console.log('🔐 Getting current user from Supabase auth...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('💥 Error getting user from auth:', userError)
        throw userError
      }
      
      if (!user) {
        console.log('❌ No authenticated user found')
        return null
      }
      
      console.log('✅ Authenticated user found:', user.email)
      console.log('📝 Fetching profile for user:', user.id)
      
      try {
        // Get user profile with role and restaurant info
        console.log('🔄 Attempting full profile fetch with restaurant join...')
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            restaurant:restaurants(*)
          `)
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Profile fetch error:', profileError)
          
          // If RLS policy error, try a simpler query without restaurant join
          if (profileError.code === '42P17' || profileError.message.includes('infinite recursion')) {
            console.log('🔄 Trying simplified profile query without restaurant join...')
            const { data: simpleProfile, error: simpleError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (!simpleError && simpleProfile) {
              console.log('✅ Simple profile fetch successful:', simpleProfile.role)
              user.profile = simpleProfile
            } else {
              console.error('❌ Simple profile fetch also failed:', simpleError)
              // For master admin, create a minimal profile if none exists
              if (user.email === 'masteradmin@system.com') {
                console.log('🛠️ Creating fallback profile for master admin')
                user.profile = {
                  id: user.id,
                  email: user.email,
                  username: 'masteradmin',
                  full_name: 'System Master Administrator',
                  role: 'master_admin',
                  restaurant_id: null,
                  is_active: true
                }
              } else {
                console.log('⚠️ No profile found and not master admin - returning user without profile')
              }
            }
          } else {
            console.error('❌ Unknown profile fetch error:', profileError)
            throw profileError
          }
        } else if (profile) {
          console.log('✅ Full profile fetch successful:', profile.role)
          user.profile = profile
        }
      } catch (error) {
        console.error('💥 Unexpected error fetching profile:', error)
        
        // For master admin, provide a fallback profile
        if (user.email === 'masteradmin@system.com') {
          console.log('🛠️ Using fallback profile for master admin due to error')
          user.profile = {
            id: user.id,
            email: user.email,
            username: 'masteradmin',
            full_name: 'System Master Administrator',
            role: 'master_admin',
            restaurant_id: null,
            is_active: true
          }
        } else {
          // For other users, still return the user object but without profile
          console.log('⚠️ Returning user without profile due to error')
        }
      }
      
      console.log('🏁 getCurrentUser completed for:', user.email)
      return user
    }
    
    try {
      return await Promise.race([getCurrentUserPromise(), timeout])
    } catch (error) {
      console.error('💥 getCurrentUser failed or timed out:', error)
      
      // Return null or demo user depending on mode
      if (isDemoMode) {
        return { id: 'demo-user', email: 'demo@example.com' }
      }
      
      // If it's a timeout and we're looking for master admin, return fallback
      if (error.message === 'getCurrentUser timeout') {
        console.log('⏰ Timeout detected - checking if this might be master admin session')
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email === 'masteradmin@system.com') {
            console.log('🛠️ Creating timeout fallback for master admin')
            user.profile = {
              id: user.id,
              email: user.email,
              username: 'masteradmin',
              full_name: 'System Master Administrator',
              role: 'master_admin',
              restaurant_id: null,
              is_active: true
            }
            return user
          }
        } catch (fallbackError) {
          console.error('💥 Fallback auth check failed:', fallbackError)
        }
      }
      
      return null
    }
  },

  // Get user role
  async getUserRole(userId) {
    if (isDemoMode) {
      return 'staff'
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    return error ? null : data?.role
  },

  // Check if user has specific role or higher
  hasRole(userProfile, requiredRole) {
    if (!userProfile) return false
    
    const roleHierarchy = {
      'staff': 1,
      'admin': 2,
      'master_admin': 3
    }
    
    const userRoleLevel = roleHierarchy[userProfile.role] || 0
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0
    
    return userRoleLevel >= requiredRoleLevel
  },

  // Product helpers
  async getProducts(restaurantId) {
    if (isDemoMode) {
      return { data: demoData.products, error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name')
    return { data, error }
  },

  async addProduct(product) {
    if (isDemoMode) {
      return { data: [product], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([product])
      .select()
    return { data, error }
  },

  async updateProduct(id, updates) {
    if (isDemoMode) {
      return { data: [updates], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteProduct(id) {
    if (isDemoMode) {
      return { error: null }
    }
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id)
    return { error }
  },

  // Combo helpers
  async getCombos(restaurantId) {
    if (isDemoMode) {
      return { data: demoData.combos, error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.COMBOS)
      .select(`
        *,
        combo_items:combo_items(
          product:products(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
    return { data, error }
  },

  // Order helpers
  async createDraftOrder(order) {
    if (isDemoMode) {
      return { data: [order], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .insert([order])
      .select()
    return { data, error }
  },

  async updateDraftOrder(id, updates) {
    if (isDemoMode) {
      return { data: [updates], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async getDraftOrders(restaurantId) {
    if (isDemoMode) {
      return { data: [], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .select(`
        *,
        order_items:order_items(
          product:products(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'draft')
    return { data, error }
  },

  async finalizeOrder(orderId) {
    if (isDemoMode) {
      return { data: [{ id: orderId, status: 'finalized' }], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .update({ status: 'finalized' })
      .eq('id', orderId)
      .select()
    return { data, error }
  },

  // Sales helpers
  async createSale(sale) {
    if (isDemoMode) {
      return { data: [sale], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.SALES)
      .insert([sale])
      .select()
    return { data, error }
  },

  async getSales(restaurantId, dateRange) {
    if (isDemoMode) {
      return { data: demoData.sales, error: null }
    }
    let query = supabase
      .from(TABLES.SALES)
      .select(`
        *,
        order_items:order_items(
          product:products(*)
        )
      `)
      .eq('restaurant_id', restaurantId)

    if (dateRange) {
      query = query.gte('created_at', dateRange.start)
      query = query.lte('created_at', dateRange.end)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  },

  // Offer helpers
  async getOffers(restaurantId) {
    if (isDemoMode) {
      return { data: demoData.offers, error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.OFFERS)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
    return { data, error }
  },

  // Restaurant helpers
  async getRestaurants() {
    if (isDemoMode) {
      return { data: [{ id: 'demo-restaurant', name: 'Demo Cafe' }], error: null }
    }
    const { data, error } = await supabase
      .from(TABLES.RESTAURANTS)
      .select('*')
      .order('name')
    return { data, error }
  }
} 