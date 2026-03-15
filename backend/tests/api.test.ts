import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import individual routes instead of full app
import paymentRoutes from '../src/routes/payments';

describe('API Routes Test', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create minimal app for testing
    app = express();
    
    app.use(helmet());
    app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests'
    }));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'SORED Backend is running' });
    });

    // Payment routes
    app.use('/api/payments', paymentRoutes);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Mercado Pago Public Key', () => {
    it('should return public key', async () => {
      const response = await request(app)
        .get('/api/payments/public-key')
        .expect(200);

      expect(response.body).toHaveProperty('publicKey');
      expect(typeof response.body.publicKey).toBe('string');
      expect(response.body.publicKey).toMatch(/^(TEST-|APP_USR-)/);
    });
  });

  describe('PIX Payment Creation', () => {
    it('should create PIX payment with valid data', async () => {
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
      expect(response.body).toHaveProperty('dateOfExpiration');
    });

    it('should reject invalid PIX data', async () => {
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
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should require mandatory PIX fields', async () => {
      const incompleteData = {
        amount: 10
        // Missing orderId, description, payerEmail, etc.
      };

      const response = await request(app)
        .post('/api/payments/pix/create')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Checkout Creation', () => {
    it('should create checkout with valid data', async () => {
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
      expect(response.body).toHaveProperty('paymentMethod', 'credit_card');
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR Code for valid payment ID', async () => {
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
      expect(qrResponse.body).toHaveProperty('expirationDate');
    });

    it('should handle QR Code request for non-existent payment', async () => {
      const response = await request(app)
        .get('/api/payments/pix/qrcode/nonexistent_payment')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmailData = {
        orderId: 'test_123',
        amount: 10,
        description: 'Test',
        payerEmail: 'invalid-email-format',
        payerFirstName: 'Test',
        payerLastName: 'User',
        payerPhone: '11999999999'
      };

      const response = await request(app)
        .post('/api/payments/pix/create')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      const emailError = response.body.errors.find((err: any) => err.field === 'payerEmail');
      expect(emailError).toBeDefined();
      expect(emailError.message).toContain('inválido');
    });

    it('should validate phone format', async () => {
      const invalidPhoneData = {
        orderId: 'test_123',
        amount: 10,
        description: 'Test',
        payerEmail: 'test@example.com',
        payerFirstName: 'Test',
        payerLastName: 'User',
        payerPhone: '123' // Too short
      };

      const response = await request(app)
        .post('/api/payments/pix/create')
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      const phoneError = response.body.errors.find((err: any) => err.field === 'payerPhone');
      expect(phoneError).toBeDefined();
      expect(phoneError.message).toContain('10 ou 11 dígitos');
    });

    it('should validate amount is positive', async () => {
      const invalidAmountData = {
        orderId: 'test_123',
        amount: 0,
        description: 'Test',
        payerEmail: 'test@example.com',
        payerFirstName: 'Test',
        payerLastName: 'User',
        payerPhone: '11999999999'
      };

      const response = await request(app)
        .post('/api/payments/pix/create')
        .send(invalidAmountData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      const amountError = response.body.errors.find((err: any) => err.field === 'amount');
      expect(amountError).toBeDefined();
      expect(amountError.message).toContain('maior que zero');
    });
  });
});
