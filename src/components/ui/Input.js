import React from 'react'
import { clsx } from 'clsx'

const Input = React.forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error && 'border-danger-300 focus:ring-danger-500 focus:border-danger-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input 