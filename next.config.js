/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
    experimental: {
        allowedDevOrigins: ["6000-firebase-studio-1762977242084.cluster-utvmpwb6ojhlcsay7va6s7qkck.cloudworkstations.dev"],
    },
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
};

module.exports = nextConfig;

// Stable version
