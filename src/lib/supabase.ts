import { createClient } from '@supabase/supabase-js'
import config from '../config/env'

const supabaseUrl = config.supabase.url
const supabaseAnonKey = config.supabase.anonKey

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  console.error('❌ Supabase Environment Variables Check Failed:');
  console.error(`   Environment: ${config.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  console.error(`   Missing variables: ${missing.join(', ')}`);
  console.error(`   Current values:`);
  console.error(`     VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}`);
  console.error(`     VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[SET]' : 'undefined'}`);

  throw new Error(`Missing Supabase environment variables for ${config.isDevelopment ? 'development' : 'production'} environment: ${missing.join(', ')}`)
}

// Log which database we're connecting to
console.log(`🔗 Connecting to ${config.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} Supabase database:`)
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Project ID: ${config.supabase.projectId}`)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type { Database } from './database.types' 