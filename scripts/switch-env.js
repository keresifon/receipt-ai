#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const envFile = path.join(process.cwd(), '.env.local')
const envExample = path.join(process.cwd(), 'env.example')

function switchEnvironment(targetEnv) {
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.local file not found!')
    process.exit(1)
  }

  let envContent = fs.readFileSync(envFile, 'utf8')
  
  if (targetEnv === 'dev') {
    // Switch to development environment
    envContent = envContent.replace(
      /NEXTAUTH_URL=https:\/\/no-wahala\.net/g,
      'NEXTAUTH_URL=http://localhost:3000'
    )
    envContent = envContent.replace(
      /SITE_URL=https:\/\/no-wahala\.net/g,
      'SITE_URL=http://localhost:3000'
    )
    console.log('✅ Switched to DEVELOPMENT environment')
    console.log('   NEXTAUTH_URL=http://localhost:3000')
    console.log('   SITE_URL=http://localhost:3000')
  } else if (targetEnv === 'prod') {
    // Switch to production environment
    envContent = envContent.replace(
      /NEXTAUTH_URL=http:\/\/localhost:3000/g,
      'NEXTAUTH_URL=https://no-wahala.net'
    )
    envContent = envContent.replace(
      /SITE_URL=http:\/\/localhost:3000/g,
      'SITE_URL=https://no-wahala.net'
    )
    console.log('✅ Switched to PRODUCTION environment')
    console.log('   NEXTAUTH_URL=https://no-wahala.net')
    console.log('   SITE_URL=https://no-wahala.net')
  } else {
    console.error('❌ Invalid environment. Use "dev" or "prod"')
    console.log('Usage: node scripts/switch-env.js [dev|prod]')
    process.exit(1)
  }

  fs.writeFileSync(envFile, envContent)
  console.log('📝 .env.local updated successfully')
}

const targetEnv = process.argv[2]

if (!targetEnv) {
  console.log('Current environment variables:')
  const envContent = fs.readFileSync(envFile, 'utf8')
  const nextAuthUrl = envContent.match(/NEXTAUTH_URL=(.+)/)?.[1]
  const siteUrl = envContent.match(/SITE_URL=(.+)/)?.[1]
  
  console.log(`   NEXTAUTH_URL=${nextAuthUrl}`)
  console.log(`   SITE_URL=${siteUrl}`)
  console.log('\nTo switch environments:')
  console.log('   npm run env:dev    (switch to development)')
  console.log('   npm run env:prod   (switch to production)')
  process.exit(0)
}

switchEnvironment(targetEnv)

