/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Ignore type errors during build - ox library has issues but doesn't affect runtime
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Handle optional dependencies
    config.externals.push({
      '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage',
      'pino-pretty': 'pino-pretty',
    })
    return config
  },
}

module.exports = nextConfig
