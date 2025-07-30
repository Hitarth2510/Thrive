import React from 'react'
import { useAuth } from '../../contexts/EnhancedAuthContext'
import MasterAdminDashboard from './MasterAdminDashboard'
import CafeAdminDashboard from './CafeAdminDashboard'
import StaffDashboard from './StaffDashboard'

const Dashboard = () => {
  const { userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Profile Not Found</h2>
          <p className="text-red-600">Unable to load user profile.</p>
        </div>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  switch (userProfile.role) {
    case 'master_admin':
      return <MasterAdminDashboard />
    case 'cafe_restaurant_admin':
      return <CafeAdminDashboard />
    case 'staff':
      return <StaffDashboard />
    default:
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-yellow-800 font-semibold">Unknown Role</h2>
            <p className="text-yellow-600">Your user role ({userProfile.role}) is not recognized.</p>
          </div>
        </div>
      )
  }
}

export default Dashboard
