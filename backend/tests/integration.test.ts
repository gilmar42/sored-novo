import request from 'supertest';
import app from '../src/index';

describe('API Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message');
  });
});

describe('Mercado Pago Integration', () => {
  it('should return public key', async () => {
    const response = await request(app)
      .get('/api/payments/public-key')
      .expect(200);

    expect(response.body).toHaveProperty('publicKey');
    expect(typeof response.body.publicKey).toBe('string');
  });

  it('should handle PIX payment creation with fallback', async () => {
    const pixData = {
      orderId: 'test_123',
      amount: 10,
      description: 'Test PIX payment',
      payerEmail: 'test@example.com',
      payerFirstName: 'Test',
      payerLastName: 'User',
      payerPhone: '11999999999'
    };

    const response = await request(app)
      .post('/api/payments/pix/create')
      .send(pixData)
      .expect(200);

    expect(response.body).toHaveProperty('paymentId');
    expect(response.body).toHaveProperty('status', 'pending');
    expect(response.body).toHaveProperty('transactionAmount', 10);
  });

  it('should handle checkout creation with fallback', async () => {
    const checkoutData = {
      orderId: 'test_checkout_123',
      amount: 50,
      description: 'Test checkout',
      paymentMethod: 'credit_card',
      payerEmail: 'test@example.com',
      payerFirstName: 'Test',
      payerLastName: 'User',
      payerPhone: '11999999999',
      returnUrl: 'http://localhost:3000/success'
    };

    const response = await request(app)
      .post('/api/payments/checkout')
      .send(checkoutData)
      .expect(200);

    expect(response.body).toHaveProperty('paymentId');
    expect(response.body).toHaveProperty('preferenceId');
    expect(response.body).toHaveProperty('initPoint');
    expect(response.body).toHaveProperty('sandbox', true);
  });

  it('should handle QR Code generation with fallback', async () => {
    // First create a PIX payment
    const pixData = {
      orderId: 'test_qr_123',
      amount: 25,
      description: 'Test QR Code',
      payerEmail: 'test@example.com',
      payerFirstName: 'Test',
      payerLastName: 'User',
      payerPhone: '11999999999'
    };

    const createResponse = await request(app)
      .post('/api/payments/pix/create')
      .send(pixData)
      .expect(200);

    const paymentId = createResponse.body.paymentId;

    // Then get QR Code
    const qrResponse = await request(app)
      .get(`/api/payments/pix/qrcode/${paymentId}`)
      .expect(200);

    expect(qrResponse.body).toHaveProperty('qrCode');
    expect(qrResponse.body).toHaveProperty('qrCodeText');
    expect(qrResponse.body).toHaveProperty('copyAndPasteKey');
    expect(qrResponse.body).toHaveProperty('status', 'pending');
  });
});

describe('Error Handling', () => {
  it('should handle invalid PIX data', async () => {
    const invalidData = {
      orderId: '',
      amount: -10,
      description: '',
      payerEmail: 'invalid-email'
    };

    const response = await request(app)
      .post('/api/payments/pix/create')
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('errors');
  });

  it('should handle missing QR Code', async () => {
    const response = await request(app)
      .get('/api/payments/pix/qrcode/nonexistent')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});
