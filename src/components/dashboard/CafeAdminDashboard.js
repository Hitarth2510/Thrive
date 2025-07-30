import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/EnhancedAuthContext'
import { BarChart3, DollarSign, ShoppingCart, Users, TrendingUp, Calendar, Download, Plus } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const CafeAdminDashboard = () => {
  const { userProfile, currentRestaurant, supabase } = useAuth()
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    todayProfit: 0,
    weekProfit: 0,
    monthProfit: 0
  })
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    loadDashboardData()
  }, [currentRestaurant, dateFilter])

  const loadDashboardData = async () => {
    if (!currentRestaurant) return

    setLoading(true)
    try {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)

      // Fetch sales orders
      const { data: salesOrders, error } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('datetime_paid', { ascending: false })

      if (error) throw error

      // Calculate stats
      const todayOrders = salesOrders?.filter(order => 
        new Date(order.datetime_paid) >= startOfToday
      ) || []
      
      const weekOrders = salesOrders?.filter(order => 
        new Date(order.datetime_paid) >= startOfWeek
      ) || []
      
      const monthOrders = salesOrders?.filter(order => 
        new Date(order.datetime_paid) >= startOfMonth
      ) || []

      const calculateTotals = (orders) => ({
        sales: orders.reduce((sum, order) => sum + (order.final_amount || 0), 0),
        orders: orders.length,
        profit: orders.reduce((sum, order) => sum + (order.profit || 0), 0)
      })

      const todayStats = calculateTotals(todayOrders)
      const weekStats = calculateTotals(weekOrders)
      const monthStats = calculateTotals(monthOrders)

      setStats({
        todaySales: todayStats.sales,
        weekSales: weekStats.sales,
        monthSales: monthStats.sales,
        todayOrders: todayStats.orders,
        weekOrders: weekStats.orders,
        monthOrders: monthStats.orders,
        todayProfit: todayStats.profit,
        weekProfit: weekStats.profit,
        monthProfit: monthStats.profit
      })

      // Set recent orders
      setRecentOrders(salesOrders?.slice(0, 5) || [])

      // Calculate top products (simplified)
      const productCounts = {}
      salesOrders?.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            const key = item.product_id || item.combo_id
            if (key) {
              productCounts[key] = (productCounts[key] || 0) + item.quantity
            }
          })
        }
      })

      const topProductsArray = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ id, count, name: `Product ${id.slice(0, 8)}` }))

      setTopProducts(topProductsArray)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportSalesData = async () => {
    try {
      const { data: salesOrders } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('datetime_paid', { ascending: false })

      const csvContent = [
        'Date,Order ID,Customer,Total Amount,Profit,Payment Method',
        ...(salesOrders || []).map(order => [
          new Date(order.datetime_paid).toLocaleDateString(),
          order.id.slice(0, 8),
          order.customer_name || 'N/A',
          order.final_amount,
          order.profit || 0,
          order.payment_type
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const getCurrentStats = () => {
    switch (dateFilter) {
      case 'week':
        return { sales: stats.weekSales, orders: stats.weekOrders, profit: stats.weekProfit }
      case 'month':
        return { sales: stats.monthSales, orders: stats.monthOrders, profit: stats.monthProfit }
      default:
        return { sales: stats.todaySales, orders: stats.todayOrders, profit: stats.todayProfit }
    }
  }

  const currentStats = getCurrentStats()

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
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {userProfile?.full_name}! Here's how {currentRestaurant?.name} is performing.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 28 Days</option>
          </select>
          <Button onClick={exportSalesData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {dateFilter === 'today' ? "Today's" : dateFilter === 'week' ? "Week's" : "Month's"} Sales
              </p>
              <p className="text-2xl font-bold text-gray-900">${currentStats.sales.toFixed(2)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">Revenue</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.orders}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              Avg: ${currentStats.orders > 0 ? (currentStats.sales / currentStats.orders).toFixed(2) : '0.00'}
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit</p>
              <p className="text-2xl font-bold text-gray-900">${currentStats.profit.toFixed(2)}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              Margin: {currentStats.sales > 0 ? ((currentStats.profit / currentStats.sales) * 100).toFixed(1) : '0'}%
            </span>
          </div>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-900">{product.name}</span>
                <span className="text-gray-600">{product.count} sold</span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No sales data available</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{order.customer_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.datetime_paid).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.final_amount}</p>
                  <p className="text-sm text-gray-600">{order.payment_type}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">No recent orders</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="flex flex-col items-center py-4">
            <Plus className="h-6 w-6 mb-2" />
            Add Product
          </Button>
          <Button className="flex flex-col items-center py-4" variant="outline">
            <ShoppingCart className="h-6 w-6 mb-2" />
            New Order
          </Button>
          <Button className="flex flex-col items-center py-4" variant="outline">
            <Users className="h-6 w-6 mb-2" />
            Manage Staff
          </Button>
          <Button className="flex flex-col items-center py-4" variant="outline">
            <BarChart3 className="h-6 w-6 mb-2" />
            View Reports
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default CafeAdminDashboard
