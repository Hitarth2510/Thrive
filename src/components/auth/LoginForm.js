import React, { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Eye, EyeOff, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const isDemoModeRuntime = !supabaseUrl ||
  supabaseUrl === 'your_supabase_project_url' ||
  supabaseUrl === 'https://demo.supabase.co' ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseAnonKey === 'demo_anon_key';

// Check if we're in demo mode
const isDemoMode = !process.env.REACT_APP_SUPABASE_URL || 
  process.env.REACT_APP_SUPABASE_URL === 'https://demo.supabase.co' ||
  process.env.REACT_APP_SUPABASE_URL === 'your_supabase_project_url'

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, login } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError('');
        console.log('🔵 LoginForm: Starting login for:', values.email);
        
        // Try signIn first, fallback to login
        const loginFunction = signIn || login;
        if (!loginFunction) {
          throw new Error('No login function available');
        }
        
        const result = await loginFunction(values.email, values.password);
        console.log('🔵 LoginForm: Login result:', result);
        
        if (!result.success) {
          setError(result.error || 'Invalid credentials');
        } else {
          console.log('🟢 LoginForm: Login successful');
        }
      } catch (err) {
        console.error('❌ LoginForm: Login error:', err);
        setError('Login failed. Please check your credentials and try again.');
      } finally {
        setIsLoading(false);
      }
    },
  })

  // Demo mode helper functions
  const fillDemoCredentials = () => {
    formik.setValues({
      email: 'admin@thrive.com',
      password: 'demo123'
    })
  }

  const handleDemoLogin = async () => {
    await formik.handleSubmit({ email: 'admin@thrive.com', password: 'demo123' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Debug Panel */}
        <div className="mb-4 p-3 rounded bg-gray-100 border border-gray-300 text-xs text-gray-700">
          <div><b>Supabase URL:</b> {supabaseUrl || <span className="text-red-600">(not set)</span>}</div>
          <div><b>Anon Key:</b> {supabaseAnonKey ? supabaseAnonKey.slice(0, 8) + '...' : <span className="text-red-600">(not set)</span>}</div>
          <div><b>Demo Mode (runtime):</b> {String(isDemoModeRuntime)}</div>
        </div>
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="text-white text-xl font-bold">T</div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Thrive
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Cafe Billing Software
          </p>
          
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-amber-800">🎭 Demo Mode Active</h3>
                  <p className="mt-1 text-xs text-amber-700">
                    To use real database authentication, please configure your Supabase credentials in .env.local
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real Database Mode */}
          {!isDemoMode && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-green-800">🗄️ Database Mode Active</h3>
                  <p className="mt-1 text-xs text-green-700">
                    Please log in with your registered account credentials
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && formik.errors.email}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && formik.errors.password}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Login Button */}
            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            {/* Demo Mode Options */}
            {isDemoMode && (
              <div className="space-y-3">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Fill demo credentials
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleDemoLogin}
                  variant="outline"
                  className="w-full"
                  loading={isLoading}
                >
                  Quick Demo Login
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {isDemoMode 
              ? '🎭 Demo mode - Use any credentials or click demo login' 
              : '🔒 Secure database authentication'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm;
