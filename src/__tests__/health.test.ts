/** @jest-environment node */

describe('API de Saude', () => {
  it('funciona', async () => {
    // O endpoint usa Prisma; em teste, mockamos para nao depender de banco.
    jest.resetModules();
    jest.doMock('@/lib/prisma', () => ({
      __esModule: true,
      default: {
        $queryRaw: jest.fn().mockResolvedValue(1),
      },
    }));

    const { GET } = await import('../app/api/health/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });
});
