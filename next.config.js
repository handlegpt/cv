/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    MAIN_DOMAIN: process.env.MAIN_DOMAIN,
  },
}

module.exports = nextConfig 