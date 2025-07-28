import React, { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const LoginForm = () => {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setIsLoading(true)
    const result = await signIn(values.email, values.password)
    setIsLoading(false)
    
    if (!result.success) {
      setErrors({ password: result.error })
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cafe Billing Software
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-6">
                <Field name="email">
                  {({ field }) => (
                    <Input
                      {...field}
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      error={touched.email && errors.email}
                    />
                  )}
                </Field>

                <Field name="password">
                  {({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        error={touched.password && errors.password}
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
                  )}
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isSubmitting}
                >
                  Sign In
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  )
}

export default LoginForm 