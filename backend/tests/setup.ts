import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sored_test';

// Evita conexao real, mas preserva Schema/Types (necessario para carregar os models).
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(actual),
    connection: {
      ...actual.connection,
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      once: jest.fn(),
    },
  };
});
