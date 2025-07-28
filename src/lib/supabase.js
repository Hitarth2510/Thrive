import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Product helpers
  async getProducts(restaurantId) {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name')
    return { data, error }
  },

  async addProduct(product) {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([product])
      .select()
    return { data, error }
  },

  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id)
    return { error }
  },

  // Combo helpers
  async getCombos(restaurantId) {
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
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .insert([order])
      .select()
    return { data, error }
  },

  async updateDraftOrder(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async getDraftOrders(restaurantId) {
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
    const { data, error } = await supabase
      .from(TABLES.DRAFT_ORDERS)
      .update({ status: 'finalized' })
      .eq('id', orderId)
      .select()
    return { data, error }
  },

  // Sales helpers
  async createSale(sale) {
    const { data, error } = await supabase
      .from(TABLES.SALES)
      .insert([sale])
      .select()
    return { data, error }
  },

  async getSales(restaurantId, dateRange) {
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
    const { data, error } = await supabase
      .from(TABLES.OFFERS)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
    return { data, error }
  },

  // Restaurant helpers
  async getRestaurants() {
    const { data, error } = await supabase
      .from(TABLES.RESTAURANTS)
      .select('*')
      .order('name')
    return { data, error }
  }
} 