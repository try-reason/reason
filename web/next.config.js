const removeImports = require("next-remove-imports")();
module.exports = removeImports({
  experimental: { esmExternals: true }
});

// /** @type {import('next').NextConfig} */
// const nextConfig = {}

// module.exports = nextConfig
