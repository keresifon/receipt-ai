/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    SITE_URL: process.env.SITE_URL || 'https://no-wahala.net',
  },
}

module.exports = nextConfig
