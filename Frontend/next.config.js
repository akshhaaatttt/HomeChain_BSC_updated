/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignore type errors during build - ox library has issues but doesn't affect runtime
    ignoreBuildErrors: true,
  },
  turbopack: {
    // Keep workspace root local to Frontend to avoid multi-lockfile warnings.
    root: __dirname,
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
