/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "c.saavncdn.com"          },
      { protocol: "https", hostname: "*.saavncdn.com"          },
      { protocol: "https", hostname: "az-avatar.vercel.app"    },
      { protocol: "https", hostname: "i.ytimg.com"             },
      { protocol: "https", hostname: "img.youtube.com"         },
      { protocol: "https", hostname: "*.ytimg.com"             },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.scdn.co"               }, // Spotify images
      { protocol: "https", hostname: "*.scdn.co"               },
      { protocol: "https", hostname: "mosaic.scdn.co"          },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/browserconfig.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/apple-touch-icon.png",            destination: "/ios/180.png", permanent: true },
      { source: "/apple-touch-icon-precomposed.png",destination: "/ios/180.png", permanent: true },
    ];
  },
};

export default nextConfig;
