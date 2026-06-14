import React, { createContext, useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    init()

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const signInWithEmail = (email) => supabase.auth.signInWithOtp({ email })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
