import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/EnhancedAuthContext'
import { ShoppingCart, Clock, DollarSign, Plus } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const StaffDashboard = () => {
  const { userProfile, currentRestaurant, supabase } = useAuth()
  const [todayStats, setTodayStats] = useState({
    orders: 0,
    sales: 0,
    myOrders: 0
  })
  const [draftOrders, setDraftOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStaffData()
  }, [currentRestaurant, userProfile])

  const loadStaffData = async () => {
    if (!currentRestaurant || !userProfile) return

    setLoading(true)
    try {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      // Fetch today's sales orders
      const { data: todaySales, error: salesError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .gte('datetime_paid', startOfToday.toISOString())

      if (salesError) throw salesError

      // Fetch my draft orders
      const { data: myDrafts, error: draftsError } = await supabase
        .from('draft_orders')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .eq('created_by_user_id', userProfile.id)
        .order('datetime_created', { ascending: false })

      if (draftsError) throw draftsError

      // Calculate stats
      const totalSales = todaySales?.reduce((sum, order) => sum + (order.final_amount || 0), 0) || 0
      const myTodayOrders = todaySales?.filter(order => order.processed_by_user_id === userProfile.id) || []

      setTodayStats({
        orders: todaySales?.length || 0,
        sales: totalSales,
        myOrders: myTodayOrders.length
      })

      setDraftOrders(myDrafts || [])

    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDraftOrder = async (draftId) => {
    try {
      const { error } = await supabase
        .from('draft_orders')
        .delete()
        .eq('id', draftId)

      if (error) throw error
      
      // Refresh draft orders
      loadStaffData()
    } catch (error) {
      console.error('Error deleting draft order:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {userProfile?.full_name}! Ready to serve customers at {currentRestaurant?.name}?
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.orders}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Total restaurant orders</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">${todayStats.sales.toFixed(2)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Total revenue today</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Orders</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.myOrders}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Orders I processed</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button size="lg" className="flex items-center justify-center py-6">
            <Plus className="h-6 w-6 mr-2" />
            Create New Order
          </Button>
          <Button size="lg" variant="outline" className="flex items-center justify-center py-6">
            <ShoppingCart className="h-6 w-6 mr-2" />
            View Menu
          </Button>
        </div>
      </Card>

      {/* Draft Orders */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Draft Orders</h3>
          <span className="text-sm text-gray-600">{draftOrders.length} drafts</span>
        </div>
        
        <div className="space-y-3">
          {draftOrders.length > 0 ? draftOrders.map((draft) => (
            <div key={draft.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">
                  {draft.customer_name || 'Unnamed Order'}
                  {draft.table_number && ` - Table ${draft.table_number}`}
                </p>
                <p className="text-sm text-gray-600">
                  Created: {new Date(draft.datetime_created).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Items: {Array.isArray(draft.items) ? draft.items.length : 0} | 
                  Subtotal: ${draft.subtotal?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Resume
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteDraftOrder(draft.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No draft orders</p>
              <p className="text-sm text-gray-400">Start a new order to see drafts here</p>
            </div>
          )}
        </div>
      </Card>

      {/* Performance Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Orders Processed</h4>
            <div className="text-3xl font-bold text-blue-600">{todayStats.myOrders}</div>
            <p className="text-sm text-gray-600">
              {todayStats.orders > 0 
                ? `${((todayStats.myOrders / todayStats.orders) * 100).toFixed(1)}% of total orders`
                : 'No orders today yet'
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Draft Orders</h4>
            <div className="text-3xl font-bold text-orange-600">{draftOrders.length}</div>
            <p className="text-sm text-gray-600">Pending completion</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StaffDashboard
