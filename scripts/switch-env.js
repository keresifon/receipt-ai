#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Environment configurations
const ENVIRONMENTS = {
  dev: {
    NEXTAUTH_URL: 'http://localhost:3000',
    SITE_URL: 'http://localhost:3000'
  },
  prod: {
    NEXTAUTH_URL: 'https://no-wahala.net',
    SITE_URL: 'https://no-wahala.net'
  }
}

function switchEnvironment(targetEnv) {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  let newContent = envContent
  
  const targetConfig = ENVIRONMENTS[targetEnv]
  if (!targetConfig) {
    console.error(`❌ Invalid environment: ${targetEnv}`)
    console.log('Available environments: dev, prod')
    process.exit(1)
  }

  // Update or add each environment variable
  Object.entries(targetConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*`, 'm')
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `${key}=${value}`)
    } else {
      newContent += `\n${key}=${value}`
    }
  })

  // Write the updated content
  fs.writeFileSync(envPath, newContent)
  
  console.log(`✅ Switched to ${targetEnv.toUpperCase()} environment`)
  console.log(`   NEXTAUTH_URL: ${targetConfig.NEXTAUTH_URL}`)
  console.log(`   SITE_URL: ${targetConfig.SITE_URL}`)
  console.log('\n🔄 Please restart your development server for changes to take effect')
  console.log('   npm run dev')
}

// Get command line argument
const targetEnv = process.argv[2]

if (!targetEnv) {
  console.log('🌍 Environment Switcher')
  console.log('Usage: node scripts/switch-env.js <environment>')
  console.log('Environments: dev, prod')
  console.log('\nExamples:')
  console.log('  node scripts/switch-env.js dev    # Switch to localhost:3000')
  console.log('  node scripts/switch-env.js prod   # Switch to no-wahala.net')
  process.exit(0)
}

switchEnvironment(targetEnv)
