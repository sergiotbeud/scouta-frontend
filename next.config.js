/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'], // Agregar dominio de Railway cuando lo tengas
    unoptimized: false,
  },
}

module.exports = nextConfig




