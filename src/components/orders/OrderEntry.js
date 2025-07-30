import React, { useState, useEffect, useCallback } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { supabaseHelpers } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

const checkoutSchema = Yup.object().shape({
  customerName: Yup.string().required('Customer name is required'),
  customerPhone: Yup.string().required('Customer phone is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
})

const OrderEntry = () => {
  const { currentRestaurant } = useAuth()
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [offers, setOffers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [selectedOffers, setSelectedOffers] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [quickDiscount, setQuickDiscount] = useState(false)

  const loadMenuData = useCallback(async () => {
    try {
      const [productsData, combosData, offersData] = await Promise.all([
        supabaseHelpers.getProducts(currentRestaurant.id),
        supabaseHelpers.getCombos(currentRestaurant.id),
        supabaseHelpers.getOffers(currentRestaurant.id)
      ])

      setProducts(productsData.data || [])
      setCombos(combosData.data || [])
      setOffers(offersData.data || [])
    } catch (error) {
      console.error('Error loading menu data:', error)
      toast.error('Failed to load menu data')
    }
  }, [currentRestaurant])

  useEffect(() => {
    if (currentRestaurant) {
      loadMenuData()
    }
  }, [currentRestaurant, loadMenuData])

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      const { data } = await supabaseHelpers.getDraftOrders(currentRestaurant.id)
      setDrafts(data || [])
    }
    if (currentRestaurant) loadDrafts()
  }, [currentRestaurant])

  // Save draft
  const saveDraft = async () => {
    const draft = {
      restaurant_id: currentRestaurant.id,
      cart,
      selectedOffers,
      quickDiscount,
      created_at: new Date().toISOString(),
    }
    await supabaseHelpers.createDraftOrder(draft)
    toast.success('Draft saved!')
  }

  // Load draft into cart
  const loadDraft = (draft) => {
    setCart(draft.cart)
    setSelectedOffers(draft.selectedOffers)
    setQuickDiscount(draft.quickDiscount)
  }

  // Remove draft
  const removeDraft = async (id) => {
    await supabaseHelpers.deleteDraftOrder(id)
    setDrafts(drafts.filter(d => d.id !== id))
    toast.success('Draft deleted!')
  }

  // Real-time sync stub
  useEffect(() => {
    // TODO: Implement WebSocket/Firebase for real-time order sync
  }, [])

  const filteredItems = [...products, ...combos].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === item.type)
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.type === item.type
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1, type: item.combo_items ? 'combo' : 'product' }])
    }
    toast.success(`${item.name} added to cart`)
  }

  const updateQuantity = (itemId, type, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, type)
      return
    }
    
    setCart(cart.map(item =>
      item.id === itemId && item.type === type
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (itemId, type) => {
    setCart(cart.filter(item => !(item.id === itemId && item.type === type)))
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // 10% quick discount
  const calculateDiscount = () => {
    let totalDiscount = 0
    if (quickDiscount) totalDiscount += calculateSubtotal() * 0.1
    selectedOffers.forEach(offerId => {
      const offer = offers.find(o => o.id === offerId)
      if (offer) {
        totalDiscount += (calculateSubtotal() * offer.discount_percentage / 100)
      }
    })
    return totalDiscount
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleCheckout = async (values) => {
    setLoading(true)
    try {
      // Create sale record
      const saleData = {
        restaurant_id: currentRestaurant.id,
        customer_name: values.customerName,
        customer_phone: values.customerPhone,
        payment_method: values.paymentMethod,
        total_amount: calculateTotal(),
        discount_amount: calculateDiscount(),
        applied_offers: selectedOffers,
        order_items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          type: item.type
        }))
      }

      const { error } = await supabaseHelpers.createSale(saleData)
      
      if (error) throw error

      toast.success('Order completed successfully!')
      setCart([])
      setSelectedOffers([])
      setShowCheckout(false)
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error('Failed to complete order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <Button
          onClick={() => setShowCheckout(true)}
          disabled={cart.length === 0}
          className="flex items-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Checkout ({cart.length} items)</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products and combos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={`${item.id}-${item.combo_items ? 'combo' : 'product'}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <span className="text-lg font-semibold text-primary-600">
                      ${item.price}
                    </span>
                  </div>
                  {item.combo_items && (
                    <p className="text-sm text-gray-600 mb-2">
                      {item.combo_items.map(comboItem => comboItem.product?.name).join(', ')}
                    </p>
                  )}
                  <Button
                    onClick={() => addToCart(item)}
                    size="sm"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart</h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.type}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">${item.price} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeFromCart(item.id, item.type)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Offers */}
                {offers.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Available Offers</h4>
                    {offers.map((offer) => (
                      <label key={offer.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedOffers.includes(offer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOffers([...selectedOffers, offer.id])
                            } else {
                              setSelectedOffers(selectedOffers.filter(id => id !== offer.id))
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {offer.name} ({offer.discount_percentage}% off)
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between text-sm text-success-600">
                      <span>Discount:</span>
                      <span>-${calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Draft Orders</h3>
            <div className="space-y-2">
              {drafts.map(draft => (
                <div key={draft.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Draft {draft.id.slice(-4)}</span>
                  <div className="space-x-2">
                    <Button size="sm" onClick={() => loadDraft(draft)}>Load</Button>
                    <Button size="sm" variant="danger" onClick={() => removeDraft(draft.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              <Button onClick={saveDraft} disabled={cart.length === 0}>Save as Draft</Button>
            </div>
          </Card>

          {/* Quick Discount */}
          <label className="flex items-center space-x-2 mt-2">
            <input type="checkbox" checked={quickDiscount} onChange={e => setQuickDiscount(e.target.checked)} />
            <span>Apply 10% Quick Discount</span>
          </label>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Checkout</h2>
            
            <Formik
              initialValues={{
                customerName: '',
                customerPhone: '',
                paymentMethod: 'cash'
              }}
              validationSchema={checkoutSchema}
              onSubmit={handleCheckout}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  <Field name="customerName">
                    {({ field }) => (
                      <Input
                        {...field}
                        label="Customer Name"
                        placeholder="Enter customer name"
                        error={touched.customerName && errors.customerName}
                      />
                    )}
                  </Field>

                  <Field name="customerPhone">
                    {({ field }) => (
                      <Input
                        {...field}
                        label="Customer Phone"
                        placeholder="Enter phone number"
                        error={touched.customerPhone && errors.customerPhone}
                      />
                    )}
                  </Field>

                  <Field name="paymentMethod">
                    {({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          {...field}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                        </select>
                      </div>
                    )}
                  </Field>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Complete Order
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderEntry 