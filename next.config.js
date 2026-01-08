/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimiza para Railway
  images: {
    domains: ['localhost'], // Agregar dominio de Railway cuando lo tengas
    unoptimized: false,
  },
}

module.exports = nextConfig




