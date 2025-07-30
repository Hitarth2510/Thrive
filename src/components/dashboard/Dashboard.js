import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { supabaseHelpers } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../ui/Card'
import Button from '../ui/Button'
import MasterAdminDashboard from './MasterAdminDashboard'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Users,
  Download
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const Dashboard = () => {
  const { currentRestaurant, isMasterAdmin } = useAuth()
  const [stats, setStats] = useState({
    today: { sales: 0, orders: 0, profit: 0 },
    week: { sales: 0, orders: 0, profit: 0 },
    month: { sales: 0, orders: 0, profit: 0 },
    custom: { sales: 0, orders: 0, profit: 0 }
  })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [topProducts, setTopProducts] = useState([])
  const [productFilter, setProductFilter] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Load sales data for different periods
      const today = new Date()
      const weekAgo = subDays(today, 7)
      const monthAgo = subDays(today, 28)

      const { data: todaySales } = await supabaseHelpers.getSales(
        currentRestaurant.id,
        { start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
      )

      const { data: weekSales } = await supabaseHelpers.getSales(
        currentRestaurant.id,
        { start: format(weekAgo, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
      )

      const { data: monthSales } = await supabaseHelpers.getSales(
        currentRestaurant.id,
        { start: format(monthAgo, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }
      )

      // Calculate stats
      const calculateStats = (sales) => {
        return sales.reduce((acc, sale) => ({
          sales: acc.sales + (sale.total_amount || 0),
          orders: acc.orders + 1,
          profit: acc.profit + (sale.profit || 0)
        }), { sales: 0, orders: 0, profit: 0 })
      }

      setStats({
        today: calculateStats(todaySales || []),
        week: calculateStats(weekSales || []),
        month: calculateStats(monthSales || [])
      })

      setRecentSales(monthSales?.slice(0, 10) || [])

      // Use custom date range if set
      const start = dateRange.startDate
      const end = dateRange.endDate
      const { data: sales } = await supabaseHelpers.getSales(currentRestaurant.id, { start, end })
      // Calculate stats
      const calculateCustomStats = (sales) => {
        return sales.reduce((acc, sale) => ({
          sales: acc.sales + (sale.total_amount || 0),
          orders: acc.orders + 1,
          profit: acc.profit + ((sale.final_amount || 0) - (sale.making_cost || 0)),
        }), { sales: 0, orders: 0, profit: 0 })
      }
      setStats({
        ...stats,
        custom: calculateCustomStats(sales || [])
      })
      // Top products/combos
      const productCounts = {}
      sales?.forEach(order => {
        (order.items || []).forEach(item => {
          const key = item.product_id || item.combo_id
          if (key) {
            productCounts[key] = (productCounts[key] || 0) + item.quantity
          }
        })
      })
      const topProductsArray = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }))
      setTopProducts(topProductsArray)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant, dateRange])

  useEffect(() => {
    if (currentRestaurant) {
      loadDashboardData()
    }
  }, [currentRestaurant, loadDashboardData])

  // Route to appropriate dashboard based on user role
  if (isMasterAdmin()) {
    return <MasterAdminDashboard />
  }

  const exportData = async () => {
    try {
      const { data: sales } = await supabaseHelpers.getSales(currentRestaurant.id)
      
      const csvContent = [
        'Date,Order ID,Customer,Items,Total,Payment Method',
        ...(sales || []).map(sale => 
          `${format(new Date(sale.created_at), 'yyyy-MM-dd')},${sale.id},${sale.customer_name || 'N/A'},${sale.order_items?.length || 0},${sale.total_amount},${sale.payment_method}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }) => (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${value.toLocaleString()}
          </p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
      </div>
    </Card>
  )

  const chartData = recentSales.map(sale => ({
    date: format(new Date(sale.created_at), 'MM/dd'),
    sales: sale.total_amount || 0
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center space-x-4">
        <label>Start:
          <input
            type="date"
            value={dateRange.startDate}
            max={dateRange.endDate}
            onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="border rounded px-2 py-1 ml-1"
          />
        </label>
        <label>End:
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="border rounded px-2 py-1 ml-1"
          />
        </label>
        <input
          type="text"
          placeholder="Filter by product/combo ID"
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sales"
          value={stats.custom?.sales || 0}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Orders"
          value={stats.custom?.orders || 0}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Profit"
          value={stats.custom?.profit || 0}
          icon={TrendingUp}
          color="warning"
        />
        <StatCard
          title="Active Customers"
          value={recentSales.length}
          icon={Users}
          color="primary"
        />
      </div>
      {/* Sales Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentSales.map(sale => ({
              date: format(new Date(sale.created_at), 'MM/dd'),
              sales: sale.total_amount || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        {/* Top Products/Combos Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products/Combos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts.filter(p => !productFilter || p.id.includes(productFilter))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{sale.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customer_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.total_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.payment_method}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard 