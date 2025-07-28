import React, { useState, useEffect } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { supabaseHelpers } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const productSchema = Yup.object().shape({
  name: Yup.string().required('Product name is required'),
  price: Yup.number().positive('Price must be positive').required('Price is required'),
  makingCost: Yup.number().min(0, 'Making cost cannot be negative').required('Making cost is required'),
})

const ProductManagement = () => {
  const { currentRestaurant } = useAuth()
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentRestaurant) {
      loadProducts()
    }
  }, [currentRestaurant])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabaseHelpers.getProducts(currentRestaurant.id)
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const productData = {
        restaurant_id: currentRestaurant.id,
        name: values.name,
        price: parseFloat(values.price),
        making_cost: parseFloat(values.makingCost),
        is_active: true
      }

      if (editingProduct) {
        const { error } = await supabaseHelpers.updateProduct(editingProduct.id, productData)
        if (error) throw error
        toast.success('Product updated successfully!')
      } else {
        const { error } = await supabaseHelpers.addProduct(productData)
        if (error) throw error
        toast.success('Product added successfully!')
      }

      await loadProducts()
      setShowForm(false)
      setEditingProduct(null)
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabaseHelpers.deleteProduct(productId)
      if (error) throw error
      
      toast.success('Product deleted successfully!')
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const calculateProfit = (price, makingCost) => {
    return price - makingCost
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <Button
          onClick={() => {
            setEditingProduct(null)
            setShowForm(true)
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Product Form */}
      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          
          <Formik
            initialValues={{
              name: editingProduct?.name || '',
              price: editingProduct?.price || '',
              makingCost: editingProduct?.making_cost || ''
            }}
            validationSchema={productSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field name="name">
                    {({ field }) => (
                      <Input
                        {...field}
                        label="Product Name"
                        placeholder="Enter product name"
                        error={touched.name && errors.name}
                      />
                    )}
                  </Field>

                  <Field name="price">
                    {({ field }) => (
                      <Input
                        {...field}
                        label="Price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        error={touched.price && errors.price}
                      />
                    )}
                  </Field>

                  <Field name="makingCost">
                    {({ field }) => (
                      <Input
                        {...field}
                        label="Making Cost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        error={touched.makingCost && errors.makingCost}
                      />
                    )}
                  </Field>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingProduct(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Making Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.making_cost}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        calculateProfit(product.price, product.making_cost) >= 0 
                          ? 'text-success-600' 
                          : 'text-danger-600'
                      }`}>
                        ${calculateProfit(product.price, product.making_cost).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ProductManagement 