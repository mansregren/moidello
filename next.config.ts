import type { NextConfig } from "next";

// CSP Report-Only — vi lär oss vad sajten faktiskt behöver innan vi
// flyttar till Content-Security-Policy. Tillåter:
// - 'unsafe-inline' style (Tailwind + framer-motion inline styles)
// - 'unsafe-inline' + 'unsafe-eval' script (Next.js runtime)
// - Supabase storage/realtime (REST + WS)
// - Vercel Analytics + Speed Insights
// - Bild-källor på remotePatterns
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://i.pravatar.cc https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-analytics.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "i.pravatar.cc" },
      { hostname: "cqarmynxrewurcbrrftn.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
