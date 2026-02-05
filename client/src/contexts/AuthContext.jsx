import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState(() => {
    const stored = localStorage.getItem('selectedSchool')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Auto-sync profile when both user and school are present
  useEffect(() => {
    const syncProfile = async () => {
      if (user && selectedSchool) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
          await fetch(`${API_URL}/teachers/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              school_id: selectedSchool.id,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher'
            })
          })
        } catch (error) {
          console.error('Profile sync failed:', error)
        }
      }
    }
    syncProfile()
  }, [user, selectedSchool])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem('selectedSchool')
    setSelectedSchool(null)
  }, [])

  const handleSetSelectedSchool = useCallback((school) => {
    setSelectedSchool(school)
    if (school) {
      localStorage.setItem('selectedSchool', JSON.stringify(school))
    } else {
      localStorage.removeItem('selectedSchool')
    }
  }, [])

  const value = {
    user,
    loading,
    selectedSchool,
    setSelectedSchool: handleSetSelectedSchool,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}