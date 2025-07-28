import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import { LogOut, User, Settings } from 'lucide-react'

const Header = ({ currentRestaurant }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Cafe Billing Software
            </h1>
            {currentRestaurant && (
              <div className="ml-4 flex items-center">
                <span className="text-gray-500">•</span>
                <span className="ml-2 text-sm text-gray-600">
                  {currentRestaurant.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 