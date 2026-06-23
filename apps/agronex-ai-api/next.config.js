/** @type {import('next').NextConfig} */
// Secrets (SUPABASE_*, GCP_*) are read at runtime via process.env in API routes only.
// Do not add an `env` block here — it would inline values into the build bundle.
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
