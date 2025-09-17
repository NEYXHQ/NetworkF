#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are present and properly configured
 */

// Define required variables for each environment
const REQUIRED_VARIABLES = {
  // Core authentication (same for both environments)
  core: [
    'VITE_WEB3AUTH_CLIENT_ID',
    'VITE_APP_NAME'
  ],
  
  // Supabase (different per environment)
  supabase: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_SUPABASE_PROJECT_ID'
  ],
  
  // Smart contracts (different per environment) 
  contracts: [
    'VITE_POLYGON_WFOUNDER_CONTRACT_ADDRESS',
    'VITE_POLYGON_WETH_CONTRACT_ADDRESS',
    'VITE_POLYGON_USDC_CONTRACT_ADDRESS',
    'VITE_POLYGON_REF_POOL_ADDRESS',
    'VITE_POLYGON_BICONOMY_PAYMASTER'
  ],
  
  // Hybrid services (same addresses, but still environment-specific configuration)
  hybrid: [
    'VITE_POLYGON_QUICKSWAP_FACTORY', 
    'VITE_POLYGON_QUICKSWAP_ROUTER'
  ],
  
  // Feature flags (optional but should be present)
  features: [
    'VITE_FEATURE_ENABLE_FIAT',
    'VITE_FEATURE_ENABLE_GAS_SPONSORSHIP', 
    'VITE_FEATURE_ENABLE_CROSS_CHAIN'
  ],
  
  // Buy flow configuration
  buyFlow: [
    'VITE_BUY_FLOW_API_BASE_URL'
  ]
};

// Known hybrid services that connect to production even in development
const HYBRID_SERVICES = {
  'VITE_POLYGON_QUICKSWAP_FACTORY': {
    description: 'QuickSwap Factory - Production only, no testnet version',
    expectedSame: true
  },
  'VITE_POLYGON_QUICKSWAP_ROUTER': { 
    description: 'QuickSwap Router - Production only, same router used for both networks',
    expectedSame: true
  }
};

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

function validateEnvironment(envName, envVars) {
  const results = {
    envName,
    missing: [],
    empty: [],
    warnings: [],
    hybrid: {},
    valid: true
  };
  
  // Check all required variable categories
  Object.entries(REQUIRED_VARIABLES).forEach(([category, variables]) => {
    variables.forEach(varName => {
      if (!(varName in envVars)) {
        results.missing.push({ category, variable: varName });
        results.valid = false;
      } else if (!envVars[varName] || envVars[varName].trim() === '') {
        results.empty.push({ category, variable: varName });
        results.valid = false;
      }
    });
  });
  
  // Check hybrid services
  Object.entries(HYBRID_SERVICES).forEach(([varName, config]) => {
    if (varName in envVars) {
      results.hybrid[varName] = {
        value: envVars[varName],
        ...config
      };
    }
  });
  
  // Validation warnings
  if (envName === 'development') {
    // In development, warn about production-like URLs
    if (envVars.VITE_SUPABASE_URL && !envVars.VITE_SUPABASE_URL.includes('dev')) {
      results.warnings.push('Development Supabase URL does not contain "dev" - verify this is correct');
    }
  } else if (envName === 'production') {
    // In production, warn about development-like configurations  
    if (envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_URL.includes('dev')) {
      results.warnings.push('Production Supabase URL contains "dev" - verify this is correct');
    }
  }
  
  return results;
}

function compareEnvironments(devEnv, prodEnv) {
  const comparison = {
    identical: [],
    different: [],
    devOnly: [],
    prodOnly: []
  };
  
  // Find all unique keys
  const allKeys = new Set([...Object.keys(devEnv), ...Object.keys(prodEnv)]);
  
  allKeys.forEach(key => {
    const inDev = key in devEnv;
    const inProd = key in prodEnv;
    
    if (inDev && inProd) {
      if (devEnv[key] === prodEnv[key]) {
        comparison.identical.push(key);
      } else {
        comparison.different.push({
          key,
          dev: devEnv[key],
          prod: prodEnv[key],
          isHybrid: key in HYBRID_SERVICES
        });
      }
    } else if (inDev && !inProd) {
      comparison.devOnly.push(key);
    } else if (!inDev && inProd) {
      comparison.prodOnly.push(key);
    }
  });
  
  return comparison;
}

function printResults(devResults, prodResults, comparison) {
  console.log('🔍 Environment Variable Validation Report');
  console.log('==========================================\n');
  
  // Development environment
  console.log(`📋 Development Environment (.env.development)`);
  if (devResults.valid) {
    console.log('✅ All required variables present');
  } else {
    console.log('❌ Issues found:');
    devResults.missing.forEach(({ category, variable }) => {
      console.log(`   • Missing [${category}]: ${variable}`);
    });
    devResults.empty.forEach(({ category, variable }) => {
      console.log(`   • Empty [${category}]: ${variable}`);
    });
  }
  
  if (devResults.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    devResults.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }
  console.log('');
  
  // Production environment
  console.log(`📋 Production Environment (.env.production)`);
  if (prodResults.valid) {
    console.log('✅ All required variables present');
  } else {
    console.log('❌ Issues found:');
    prodResults.missing.forEach(({ category, variable }) => {
      console.log(`   • Missing [${category}]: ${variable}`);
    });
    prodResults.empty.forEach(({ category, variable }) => {
      console.log(`   • Empty [${category}]: ${variable}`);
    });
  }
  
  if (prodResults.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    prodResults.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }
  console.log('');
  
  // Hybrid services analysis
  console.log(`🔄 Hybrid Services Analysis`);
  console.log('Services that connect to production even in development:');
  
  const hybridVars = Object.keys(HYBRID_SERVICES);
  if (hybridVars.length > 0) {
    hybridVars.forEach(varName => {
      const config = HYBRID_SERVICES[varName];
      const devValue = devResults.hybrid[varName]?.value || 'NOT SET';
      const prodValue = prodResults.hybrid[varName]?.value || 'NOT SET';
      const isSame = devValue === prodValue;
      
      console.log(`   • ${varName}: ${config.description}`);
      console.log(`     Dev:  ${devValue}`);
      console.log(`     Prod: ${prodValue}`);
      
      if (config.expectedSame && !isSame) {
        console.log(`     ⚠️  Expected identical values but they differ`);
      } else if (!config.expectedSame && isSame) {
        console.log(`     ℹ️  Values are identical (this may be intentional)`);
      } else {
        console.log(`     ✅ Configuration looks correct`);
      }
      console.log('');
    });
  }
  
  // Environment comparison summary
  console.log(`📊 Environment Comparison Summary`);
  console.log(`   • ${comparison.identical.length} identical variables`);
  console.log(`   • ${comparison.different.length} different variables`);
  console.log(`   • ${comparison.devOnly.length} dev-only variables`);
  console.log(`   • ${comparison.prodOnly.length} prod-only variables`);
  
  if (comparison.different.length > 0) {
    console.log('\n🔍 Key Differences:');
    comparison.different.forEach(({ key, dev, prod, isHybrid }) => {
      console.log(`   • ${key} ${isHybrid ? '(hybrid service)' : ''}`);
      console.log(`     Dev:  ${dev.length > 50 ? dev.substring(0, 50) + '...' : dev}`);
      console.log(`     Prod: ${prod.length > 50 ? prod.substring(0, 50) + '...' : prod}`);
    });
  }
}

async function main() {
  const rootDir = path.join(__dirname, '..');
  
  // Load environment files
  const devEnvPath = path.join(rootDir, '.env.development');
  const prodEnvPath = path.join(rootDir, '.env.production');
  
  console.log(`Loading environment files...`);
  const devEnv = loadEnvFile(devEnvPath);
  const prodEnv = loadEnvFile(prodEnvPath);
  
  if (!devEnv || !prodEnv) {
    console.error('❌ Failed to load environment files');
    process.exit(1);
  }
  
  // Validate both environments
  const devResults = validateEnvironment('development', devEnv);
  const prodResults = validateEnvironment('production', prodEnv);
  
  // Compare environments
  const comparison = compareEnvironments(devEnv, prodEnv);
  
  // Print comprehensive report
  printResults(devResults, prodResults, comparison);
  
  // Exit with appropriate code
  const hasErrors = !devResults.valid || !prodResults.valid;
  if (hasErrors) {
    console.log('\n❌ Validation failed - please fix the issues above');
    process.exit(1);
  } else {
    console.log('\n✅ Environment validation passed');
    process.exit(0);
  }
}

main().catch(console.error);