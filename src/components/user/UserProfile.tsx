import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { User, MapPin, Briefcase, Mail, Clock, CheckCircle, AlertCircle, XCircle, Target, Brain } from 'lucide-react'
import { Button } from '../ui/Button'
import { useState } from 'react'
import { FounderProfiler } from '../../features/profiler/FounderProfiler'

export const UserProfile = () => {
  const [showProfiler, setShowProfiler] = useState(false)
  
  const { 
    supabaseUser, 
    isLoading, 
    error, 
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
          {/* <Button onClick={refreshUser} className="mt-3" size="sm">
            Try Again
          </Button> */}
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
    <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'rgba(2, 48, 71, 0.8)', border: '1px solid rgba(142, 202, 230, 0.3)' }}>
      <div className="flex items-start mb-6">
        <div className="flex items-center space-x-4">
          {supabaseUser.profile_image ? (
            <img
              src={supabaseUser.profile_image}
              alt={supabaseUser.name || 'Profile'}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(142, 202, 230, 0.2)' }}>
              <User className="w-8 h-8" style={{ color: '#8ecae6' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white truncate">
              {supabaseUser.name || 'Unknown User'}
            </h2>
            {supabaseUser.headline && (
              <p className="text-white/80 mt-1 truncate">{supabaseUser.headline}</p>
            )}
            <div className="mt-2">
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-white">Contact Information</h3>
          
          {supabaseUser.email && (
            <div className="flex items-center text-sm text-white/80">
              <Mail className="w-4 h-4 mr-2" style={{ color: '#8ecae6' }} />
              <span>{supabaseUser.email}</span>
              {supabaseUser.email_verified && (
                <CheckCircle className="w-4 h-4 ml-2" style={{ color: '#f78c01' }} />
              )}
            </div>
          )}

          {supabaseUser.location && (
            <div className="flex items-center text-sm text-white/80">
              <MapPin className="w-4 h-4 mr-2" style={{ color: '#8ecae6' }} />
              <span>{supabaseUser.location}</span>
            </div>
          )}

          {supabaseUser.industry && (
            <div className="flex items-center text-sm text-white/80">
              <Briefcase className="w-4 h-4 mr-2" style={{ color: '#8ecae6' }} />
              <span>{supabaseUser.industry}</span>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-white">Account Information</h3>
          
          <div className="text-sm text-white/80">
            <span className="font-medium">Member since:</span> {formatDate(supabaseUser.created_at)}
          </div>

          {supabaseUser.last_login_at && (
            <div className="text-sm text-white/80">
              <span className="font-medium">Last login:</span> {formatDate(supabaseUser.last_login_at)}
            </div>
          )}

          {supabaseUser.linkedin_id && (
            <div className="text-sm text-white/80">
              <span className="font-medium">LinkedIn ID:</span> {supabaseUser.linkedin_id}
            </div>
          )}

          {supabaseUser.connections_count && (
            <div className="text-sm text-white/80">
              <span className="font-medium">LinkedIn Connections:</span> {supabaseUser.connections_count.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {supabaseUser.summary && (
        <div className="mt-6">
          <h3 className="font-medium text-white mb-2">About</h3>
          <p className="text-sm text-white/80 leading-relaxed">{supabaseUser.summary}</p>
        </div>
      )}

      {/* Looking For */}
      {supabaseUser.looking_for && (
        <div className="mt-6">
          <h3 className="font-medium text-white mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" style={{ color: '#f78c01' }} />
            Looking For
          </h3>
          <div className="bg-princeton-orange/10 border border-princeton-orange/30 rounded-lg p-3">
            <p className="text-sm text-princeton-orange font-medium">{supabaseUser.looking_for}</p>
          </div>
        </div>
      )}

      {/* Founder Profile */}
      {supabaseUser.profiler_profile_name && (
        <div className="mt-6">
          <h3 className="font-medium text-white mb-2 flex items-center">
            <Brain className="w-4 h-4 mr-2" style={{ color: '#8ecae6' }} />
            Founder Profile
          </h3>
          <div className="bg-slate-gray/20 border border-teal-blue/30 rounded-lg p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-soft-white/60">Profile Name:</span>
                <p className="text-sm text-soft-white font-medium">{supabaseUser.profiler_profile_name}</p>
              </div>
              <div>
                <span className="text-xs text-soft-white/60">Profile Type:</span>
                <p className="text-sm text-soft-white font-medium">{supabaseUser.profiler_profile_type}</p>
              </div>
              {supabaseUser.profiler_confidence && (
                <div>
                  <span className="text-xs text-soft-white/60">Confidence:</span>
                  <p className="text-sm text-soft-white font-medium">
                    {(supabaseUser.profiler_confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Button
                onClick={() => setShowProfiler(true)}
                variant="outline"
                size="sm"
                className="text-teal-blue border-teal-blue/30 hover:bg-teal-blue/10"
              >
                <Brain className="w-4 h-4 mr-2" />
                Retake
              </Button>
            </div>
          </div>
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
                Your application to join Wfounders is being reviewed by our team. 
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
                Unfortunately, your application to join Wfounders was not approved at this time. 
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
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">Welcome to Wfounders!</h4>
              
              
              {/* Profiler Button - Only show if profile is incomplete */}
              {!supabaseUser.profiler_profile_name && (
                <div className="mt-3">
                  <p className="text-sm text-green-700 mt-1">
                Your application has been approved. Complete your founder profile to get the most out of the network.
              </p>
                  <Button
                    onClick={() => setShowProfiler(true)}
                    size="sm"
                    className="bg-princeton-orange hover:bg-princeton-orange/90 text-white"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Complete Your Founder Profile
                  </Button>
                </div>
              )} 
               {supabaseUser.profiler_profile_name && (
                <div className="mt-3">
                  <p className="text-sm text-green-700 mt-1">
                    Your application has been approved. Complete your founder profile to get the most out of the network.
                  </p>
                </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Profiler Modal */}
      {showProfiler && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-teal-blue/30">
              <h3 className="text-lg font-semibold text-soft-white">Founder Profiler</h3>
              <button
                onClick={() => setShowProfiler(false)}
                className="text-soft-white/60 hover:text-soft-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <FounderProfiler />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile 