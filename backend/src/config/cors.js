// Configuração CORS para Hostinger + Vercel
const cors = require('cors');

const corsOptions = {
  // Origens permitidas
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://sored-industrial.vercel.app',
      'https://sored-industrial.com',
      'https://www.sored-industrial.com',
      'https://api.sored-industrial.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permitir em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://127.0.0.1:3000', 'http://127.0.0.1:3001');
    }
    
    // Origin não especificado (mobile apps, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin não permitida pelo CORS:', origin);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  
  // Métodos permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Headers permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  
  // Headers expostos
  exposedHeaders: [
    'Content-Length',
    'X-Total-Count',
    'X-Page-Count'
  ],
  
  // Permitir credentials
  credentials: true,
  
  // Cache pre-flight
  maxAge: 86400, // 24 horas
  
  // Opções de segurança
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
