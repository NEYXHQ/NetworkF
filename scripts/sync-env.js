#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROJECT_REFS = {
  dev: 'kxepoivhqnurxmkgiojo',
  prod: 'mnmlmectnlcrbnlhxyrp'
};

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function confirmSync(environment) {
  console.log(`\n🔄 About to sync environment variables to ${environment.toUpperCase()}`);
  console.log(`   Project: ${PROJECT_REFS[environment]}`);
  console.log(`   File: .env.${environment}`);
  
  const answer = await askQuestion('\n⚠️  Are you sure? This will overwrite existing Supabase secrets. (y/N): ');
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function syncEnvironment(env) {
  try {
    if (!await confirmSync(env)) {
      console.log('❌ Sync cancelled');
      return false;
    }

    console.log(`\n🔄 Syncing ${env} environment variables...`);
    const command = `supabase secrets set --project-ref ${PROJECT_REFS[env]} --env-file .env.${env}`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Successfully synced ${env} environment`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to sync ${env} environment:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment || !['dev', 'prod'].includes(environment)) {
    console.log('Usage: npm run env:sync [dev|prod]');
    console.log('Example: npm run env:sync dev');
    process.exit(1);
  }

  const success = await syncEnvironment(environment);
  rl.close();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);