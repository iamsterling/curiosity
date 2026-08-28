/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@crafty/scene-store",
    "@curiosity/custom-harness",
    "@curiosity/runtime",
  ],
};

export default nextConfig;
