#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hybrid services that connect to production even in dev
const HYBRID_SERVICES = [
  'VITE_POLYGON_QUICKSWAP_FACTORY',
  'VITE_POLYGON_QUICKSWAP_ROUTER'
];

function loadEnvFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error(`❌ Error reading ${filepath}:`, error.message);
    return null;
  }
}

function checkEnvironments() {
  const rootDir = path.join(__dirname, '..');
  const devEnv = loadEnvFile(path.join(rootDir, '.env.development'));
  const prodEnv = loadEnvFile(path.join(rootDir, '.env.production'));

  if (!devEnv || !prodEnv) {
    return false;
  }

  console.log('🔍 Environment Health Check');
  console.log('===========================\n');

  // Check hybrid services
  console.log('🔄 Hybrid Services (connect to production even in dev):');
  HYBRID_SERVICES.forEach(service => {
    const devVal = devEnv[service] || 'NOT SET';
    const prodVal = prodEnv[service] || 'NOT SET';
    const status = devVal === prodVal ? '✅ Same' : '⚠️  Different';
    
    console.log(`   ${service}: ${status}`);
    if (devVal !== prodVal) {
      console.log(`     Dev:  ${devVal}`);
      console.log(`     Prod: ${prodVal}`);
    }
  });

  // Check Supabase configuration
  console.log('\n📊 Supabase Projects:');
  console.log(`   Dev:  ${devEnv.VITE_SUPABASE_PROJECT_ID || 'NOT SET'}`);
  console.log(`   Prod: ${prodEnv.VITE_SUPABASE_PROJECT_ID || 'NOT SET'}`);

  return true;
}

checkEnvironments();