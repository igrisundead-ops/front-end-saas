/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'dl.airtable.com' },
      { protocol: 'https', hostname: 'airtableusercontent.com' },
      { protocol: 'https', hostname: 'v4.airtableusercontent.com' },
      { protocol: 'https', hostname: 'v5.airtableusercontent.com' },
    ],
  },
};

export default nextConfig;
