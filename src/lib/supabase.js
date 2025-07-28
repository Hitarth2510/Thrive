import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Check if we're in demo mode (no real Supabase credentials)
const isDemoMode = !supabaseUrl || supabaseUrl === 'your_supabase_project_url' || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key'

console.log('Demo mode:', isDemoMode)

// Create a mock client for demo mode
const createMockClient = () => ({
  auth: {
    signInWithPassword: async (credentials) => {
      console.log('Mock signInWithPassword called with:', credentials)
      return { 
        data: { 
          user: { 
            id: 'demo-user', 
            email: credentials.email || 'demo@example.com' 
          } 
        }, 
        error: null 
      }
    },
    signOut: async () => {
      console.log('Mock signOut called')
      return { error: null }
    },
    getUser: async () => {
      console.log('Mock getUser called')
      return { data: { user: { id: 'demo-user', email: 'demo@example.com' } } }
    },
    getSession: async () => {
      console.log('Mock getSession called')
      return { data: { session: null } }
    },
    onAuthStateChange: (callback) => {
      console.log('Mock onAuthStateChange called')
      // Simulate auth state change
      setTimeout(() => callback('SIGNED_IN', { user: { id: 'demo-user', email: 'demo@example.com' } }), 100)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ error: null })
    })
  })
})

export const supabase = isDemoMode ? createMockClient() : createClient(supabaseUrl, supabaseAnonKey)

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
  // Auth helpers
  async signIn(email, password) {
    console.log('supabaseHelpers.signIn called with:', email, password)
    if (isDemoMode) {
      console.log('Using demo mode for signIn')
      return { data: { user: { id: 'demo-user', email } }, error: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
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
    console.log('supabaseHelpers.getCurrentUser called')
    if (isDemoMode) {
      return { id: 'demo-user', email: 'demo@example.com' }
    }
    const { data: { user } } = await supabase.auth.getUser()
    return user
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