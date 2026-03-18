/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Configuração recomendada para deploy em VPS/Hostinger
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "**",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [],
    };
  },
  // Adicionar configuração CORS para desenvolvimento
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Certifique-se de que ALLOWED_ORIGINS no backend inclui esta URL em produção
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
