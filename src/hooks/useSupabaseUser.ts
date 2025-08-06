import { useState, useEffect } from 'react'
import { useWeb3Auth } from './useWeb3Auth'
import { userService, type LinkedInUserData } from '../services/userService'
import type { Database } from '../lib/database.types'
import type { UserInfo } from '../contexts/Web3AuthContext'

type UserRow = Database['public']['Tables']['users']['Row']

export const useSupabaseUser = () => {
  const { user: web3AuthUser, isConnected } = useWeb3Auth()
  const [supabaseUser, setSupabaseUser] = useState<UserRow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert Web3Auth user data to LinkedIn format
  const convertWeb3AuthToLinkedIn = (web3AuthUser: UserInfo): LinkedInUserData => {
    return {
      email: web3AuthUser.email,
      name: web3AuthUser.name,
      profileImage: web3AuthUser.profileImage,
      // LinkedIn specific fields - Web3Auth might provide these if LinkedIn login is used
      linkedinId: web3AuthUser.verifierId, // This might be the LinkedIn ID
      // These additional fields would need to be added to UserInfo interface or fetched separately
      // headline: web3AuthUser.headline,
      // location: web3AuthUser.location,
      // industry: web3AuthUser.industry,
      // summary: web3AuthUser.summary,
      // positions: web3AuthUser.positions,
      // educations: web3AuthUser.educations,
      // skills: web3AuthUser.skills,
      // connectionsCount: web3AuthUser.connectionsCount,
      // publicProfileUrl: web3AuthUser.publicProfileUrl,
    }
  }

  // Load or create user when Web3Auth user changes
  useEffect(() => {
    const loadUser = async () => {
      if (!isConnected || !web3AuthUser) {
        setSupabaseUser(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Use Web3Auth user ID as the primary key
        const userId = web3AuthUser.verifierId || web3AuthUser.email

        if (!userId) {
          throw new Error('No valid user ID found from Web3Auth')
        }

        // Try to get existing user (handles both UUID and email)
        let existingUser = await userService.getUserById(userId)

        if (!existingUser) {
          // Create new user from Web3Auth data
          const linkedinData = convertWeb3AuthToLinkedIn(web3AuthUser)
          existingUser = await userService.upsertUserFromLinkedIn(linkedinData, userId)
        } else {
          // Update last login - use the existing user's ID
          await userService.updateLastLogin(existingUser.id)
        }

        setSupabaseUser(existingUser)
      } catch (err) {
        console.error('Error loading/creating user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [isConnected, web3AuthUser])

  // Function to update user profile
  const updateProfile = async (updates: Partial<LinkedInUserData>): Promise<UserRow | null> => {
    if (!supabaseUser) {
      throw new Error('No user loaded')
    }

    try {
      setIsLoading(true)
      setError(null)

      const updatedUser = await userService.updateUser(supabaseUser.id, {
        name: updates.name,
        profile_image: updates.profileImage,
        headline: updates.headline,
        location: updates.location,
        industry: updates.industry,
        summary: updates.summary,
        positions: updates.positions as Database['public']['Tables']['users']['Update']['positions'],
        educations: updates.educations as Database['public']['Tables']['users']['Update']['educations'],
        skills: updates.skills as Database['public']['Tables']['users']['Update']['skills'],
        connections_count: updates.connectionsCount,
        public_profile_url: updates.publicProfileUrl,
      })

      setSupabaseUser(updatedUser)
      return updatedUser
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Function to refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!supabaseUser) return

    try {
      setIsLoading(true)
      setError(null)

      const refreshedUser = await userService.getUserById(supabaseUser.id)
      setSupabaseUser(refreshedUser)
    } catch (err) {
      console.error('Error refreshing user:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh user')
    } finally {
      setIsLoading(false)
    }
  }

  // Survey completion handler
  const completeSurvey = async (entityName: string, foundingIdea: string) => {
    if (!supabaseUser?.id) return false

    try {
      setIsLoading(true)
      setError(null)

      const updatedUser = await userService.updateSurveyResponses(
        supabaseUser.id, 
        entityName, 
        foundingIdea
      )
      
      if (updatedUser) {
        setSupabaseUser(updatedUser)
        return true
      }
      return false
    } catch (err) {
      console.error('Error completing survey:', err)
      setError(err instanceof Error ? err.message : 'Failed to save survey')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Profile completion handler
  const completeProfile = async (lookingFor: string) => {
    if (!supabaseUser?.id) return false

    try {
      setIsLoading(true)
      setError(null)

      const updatedUser = await userService.completeProfile(
        supabaseUser.id, 
        lookingFor
      )
      
      if (updatedUser) {
        setSupabaseUser(updatedUser)
        return true
      }
      return false
    } catch (err) {
      console.error('Error completing profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete profile')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    supabaseUser,
    isLoading,
    error,
    updateProfile,
    refreshUser,
    completeSurvey,
    completeProfile,
    // Helper properties
    isApproved: supabaseUser?.status === 'approved',
    isPending: supabaseUser?.status === 'pending',
    isRejected: supabaseUser?.status === 'rejected',
    needsSurvey: supabaseUser && !supabaseUser.survey_completed,
    needsProfileCompletion: supabaseUser && supabaseUser.survey_completed && !supabaseUser.profile_completed,
    isNewUser: supabaseUser && !supabaseUser.survey_completed, // Same as needsSurvey for now
  }
}

export default useSupabaseUser 