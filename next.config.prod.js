/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: false, // Desativar em produção para performance
  swcMinify: true,
  
  // Otimizações de build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mercadopago.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'sored-industrial.com',
        pathname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configurações de segurança
  poweredByHeader: false,
  compress: true,
  
  // Configurações de CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  
  // Configurações de redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Configurações de rewrites
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
  
  // Configurações de output
  output: 'standalone',
  
  // Configurações experimentais
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
