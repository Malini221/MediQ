import { supabase } from './supabase'

export const authService = {
  // Scaffold implementation for auth integration
  // Real implementation to be added later
  getSession: async () => {
    return await supabase.auth.getSession()
  },
  
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}
