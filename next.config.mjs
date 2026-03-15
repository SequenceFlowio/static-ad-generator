

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "api.kie.ai" },
      { protocol: "https", hostname: "**.kie.ai" },
    ],
  },
};

export default nextConfig;
