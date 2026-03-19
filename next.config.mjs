const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "api.kie.ai" },
      { protocol: "https", hostname: "**.kie.ai" },
    ],
  },
};

export default nextConfig;