import React from 'react'
import { clsx } from 'clsx'

const Card = React.forwardRef(({
  children,
  className = '',
  padding = 'p-6',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card 