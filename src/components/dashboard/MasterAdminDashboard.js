import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Building, Users, MapPin, Phone, Mail } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

const MasterAdminDashboard = () => {
  const { isMasterAdmin } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRestaurantForm, setShowRestaurantForm] = useState(false)
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: ''
  })
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    restaurant_id: ''
  })

  useEffect(() => {
    if (isMasterAdmin()) {
      fetchData()
    }
  }, [isMasterAdmin])

  // Redirect if not master admin
  if (!isMasterAdmin()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You need master admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name')

      if (restaurantsError) throw restaurantsError

      // Fetch cafe admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          restaurants (
            id,
            name
          )
        `)
        .eq('role', 'cafe_restaurant_admin')
        .eq('is_active', true)
        .order('full_name')

      if (adminsError) throw adminsError

      setRestaurants(restaurantsData || [])
      setAdmins(adminsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRestaurant) {
        // Update restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(formData)
          .eq('id', editingRestaurant.id)

        if (error) throw error
      } else {
        // Create restaurant
        const { error } = await supabase
          .from('restaurants')
          .insert(formData)

        if (error) throw error
      }

      setShowRestaurantForm(false)
      setEditingRestaurant(null)
      setFormData({ name: '', location: '', address: '', phone: '', email: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving restaurant:', error)
      alert('Error saving restaurant: ' + error.message)
    }
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminFormData.email,
        password: adminFormData.password,
      })

      if (authError) throw authError

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: adminFormData.email,
          username: adminFormData.email.split('@')[0],
          full_name: adminFormData.full_name,
          role: 'cafe_restaurant_admin',
          restaurant_id: adminFormData.restaurant_id,
        })

      if (profileError) throw profileError

      setShowAdminForm(false)
      setAdminFormData({ email: '', password: '', full_name: '', restaurant_id: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating admin:', error)
      alert('Error creating admin: ' + error.message)
    }
  }

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This will also remove all associated data.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      alert('Error deleting restaurant: ' + error.message)
    }
  }

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin? This will deactivate their account.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Error deleting admin: ' + error.message)
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
        <h1 className="text-3xl font-bold text-gray-900">Master Admin Dashboard</h1>
      </div>

      {/* Restaurants Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Restaurants ({restaurants.length})
          </h2>
          <Button
            onClick={() => setShowRestaurantForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingRestaurant(restaurant)
                      setFormData(restaurant)
                      setShowRestaurantForm(true)
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                {restaurant.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.location}
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {restaurant.phone}
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {restaurant.email}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Admins Section */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Restaurant Admins ({admins.length})
          </h2>
          <Button
            onClick={() => setShowAdminForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => (
            <div key={admin.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{admin.full_name}</h3>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteAdmin(admin.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-sm">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {admin.restaurants?.name || 'No Restaurant'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Restaurant Form Modal */}
      {showRestaurantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
            </h3>
            
            <form onSubmit={handleRestaurantSubmit} className="space-y-4">
              <Input
                label="Restaurant Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingRestaurant ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRestaurantForm(false)
                    setEditingRestaurant(null)
                    setFormData({ name: '', location: '', address: '', phone: '', email: '' })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Form Modal */}
      {showAdminForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Restaurant Admin</h3>
            
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={adminFormData.full_name}
                onChange={(e) => setAdminFormData({...adminFormData, full_name: e.target.value})}
                required
              />
              <Input
                label="Email"
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})}
                required
              />
              <Input
                label="Password"
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant
                </label>
                <select
                  value={adminFormData.restaurant_id}
                  onChange={(e) => setAdminFormData({...adminFormData, restaurant_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Create Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdminForm(false)
                    setAdminFormData({ email: '', password: '', full_name: '', restaurant_id: '' })
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterAdminDashboard
