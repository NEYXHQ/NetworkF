import { createClient } from '@supabase/supabase-js'
import config from '../config/env'

const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables for ${config.isDevelopment ? 'development' : 'production'} environment`)
}

// Log which database we're connecting to
console.log(`🔗 Connecting to ${config.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} Supabase database:`)
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Project ID: ${config.supabase.projectId}`)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type { Database } from './database.types' 