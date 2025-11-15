/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.postimg.cc',
            },
            {
                protocol: 'https',
                hostname: 'smartgum.com.br',
            }
        ],
    },
    experimental: {
        // This is to allow cross-origin requests from the development environment (Cloud Workstation).
        allowedDevOrigins: ["*.cloudworkstations.dev"],
    },
};

module.exports = nextConfig;
