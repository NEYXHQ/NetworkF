import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { Button } from '../ui/Button'
import { User, MapPin, Briefcase, Mail, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export const UserProfile = () => {
  const { 
    supabaseUser, 
    isLoading, 
    error, 
    refreshUser,
    isApproved,
    isPending,
    isRejected 
  } = useSupabaseUser()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <Button onClick={refreshUser} className="mt-3" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!supabaseUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-600">
          <User className="w-8 h-8 mx-auto mb-2" />
          <p>No profile data available</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Approved
        </span>
      )
    }
    if (isPending) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-4 h-4 mr-1" />
          Pending Review
        </span>
      )
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          Rejected
        </span>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          {supabaseUser.profile_image ? (
            <img
              src={supabaseUser.profile_image}
              alt={supabaseUser.name || 'Profile'}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {supabaseUser.name || 'Unknown User'}
            </h2>
            {supabaseUser.headline && (
              <p className="text-gray-600 mt-1">{supabaseUser.headline}</p>
            )}
            <div className="mt-2">
              {getStatusBadge()}
            </div>
          </div>
        </div>
        <Button onClick={refreshUser} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Contact Information</h3>
          
          {supabaseUser.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{supabaseUser.email}</span>
              {supabaseUser.email_verified && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
              )}
            </div>
          )}

          {supabaseUser.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{supabaseUser.location}</span>
            </div>
          )}

          {supabaseUser.industry && (
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="w-4 h-4 mr-2" />
              <span>{supabaseUser.industry}</span>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Account Information</h3>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">Member since:</span> {formatDate(supabaseUser.created_at)}
          </div>

          {supabaseUser.last_login_at && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last login:</span> {formatDate(supabaseUser.last_login_at)}
            </div>
          )}

          {supabaseUser.linkedin_id && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">LinkedIn ID:</span> {supabaseUser.linkedin_id}
            </div>
          )}

          {supabaseUser.connections_count && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">LinkedIn Connections:</span> {supabaseUser.connections_count.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {supabaseUser.summary && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{supabaseUser.summary}</p>
        </div>
      )}

      {/* Status Messages */}
      {isPending && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Application Under Review</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your application to join NetworkF2 is being reviewed by our team. 
                You'll be notified once a decision has been made.
              </p>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Application Not Approved</h4>
              <p className="text-sm text-red-700 mt-1">
                Unfortunately, your application to join NetworkF2 was not approved at this time. 
                Please contact support if you have questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Welcome to NetworkF2!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your application has been approved. You now have full access to the NetworkF2 platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile 