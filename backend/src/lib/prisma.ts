import { PrismaClient } from '../../../node_modules/@prisma/client';

const globalForPrisma = global as unknown as { backendPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.backendPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.backendPrisma = prisma;
}

export default prisma;
