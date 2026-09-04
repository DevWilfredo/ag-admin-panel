import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const scriptSources = ["'self'", "'unsafe-inline'"];
    if (process.env.NODE_ENV === "development") {
      scriptSources.push("'unsafe-eval'");
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "connect-src 'self' https://api.agrotrust.com.ve https://res.cloudinary.com",
              "font-src 'self' data:",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "frame-src 'self' blob: https://res.cloudinary.com",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://res.cloudinary.com",
              "object-src 'none'",
              `script-src ${scriptSources.join(" ")}`,
              "style-src 'self' 'unsafe-inline'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
