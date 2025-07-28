import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Gift, 
  BarChart3, 
  Settings,
  Users
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Offers', href: '/offers', icon: Gift },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Restaurants', href: '/restaurants', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar 