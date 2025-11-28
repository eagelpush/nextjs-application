import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ucarecdn.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Use Uploadcare loader for all images
    loader: "custom",
    loaderFile: "./node_modules/@uploadcare/nextjs-loader/build/loader.js",
  },
};

export default nextConfig;
