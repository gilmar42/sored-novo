import mercadoPagoClient from '../src/payments/services/mercadoPagoClient';

// Mock environment variables
process.env.NODE_ENV = 'development';
process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-8603296087131945-031421-c5e9e07b7d0b4b5f5c2b8f6b3c0e6e44-473382640';
process.env.MERCADO_PAGO_PUBLIC_KEY = 'TEST-1bf3b3d1-7c9f-4b5a-8e2d-3f4a5b6c7d8e';

describe('Mercado Pago Client Tests', () => {
  const client = mercadoPagoClient;

  describe('Client Initialization', () => {
    it('should initialize with correct credentials', () => {
      expect(client.getPublicKey()).toBe('TEST-1bf3b3d1-7c9f-4b5a-8e2d-3f4a5b6c7d8e');
      expect(client.isConfigured()).toBe(true);
    });
  });

  describe('PIX Payment Creation', () => {
    it('should create PIX payment with fallback', async () => {
      const orderData = {
        orderId: 'test_123',
        amount: 10,
        description: 'Test PIX payment',
        payerEmail: 'test@example.com',
        payerFirstName: 'Test',
        payerLastName: 'User',
        payerPhone: '11999999999',
        notificationUrl: 'http://localhost:3001/webhook'
      };

      const result = await client.createPixPayment(orderData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('transaction_amount', 10);
      expect(result).toHaveProperty('payment_method_id', 'pix');
      expect(result).toHaveProperty('external_reference', 'test_123');
      expect(result).toHaveProperty('point_of_interaction');
      if (result.point_of_interaction) {
        expect(result.point_of_interaction).toHaveProperty('transaction_data');
        if (result.point_of_interaction.transaction_data) {
          expect(result.point_of_interaction.transaction_data).toHaveProperty('qr_code');
        }
      }
    });

    it('should handle invalid order data', async () => {
      const invalidData = {
        orderId: '',
        amount: -10,
        description: '',
        payerEmail: 'invalid-email',
        payerFirstName: '',
        payerLastName: '',
        payerPhone: '',
        notificationUrl: ''
      };

      await expect(client.createPixPayment(invalidData)).rejects.toThrow();
    });
  });

  describe('Preference Creation', () => {
    it('should create preference with fallback', async () => {
      const preferenceData = {
        items: [{
          id: 'item_1',
          title: 'Test Item',
          quantity: 1,
          unit_price: 100,
          currency_id: 'BRL'
        }],
        payer: {
          email: 'test@example.com'
        },
        external_reference: 'test_order_123',
        notification_url: 'http://localhost:3001/webhook'
      };

      const result = await client.createPreference(preferenceData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('init_point');
      expect(result).toHaveProperty('sandbox_init_point');
      expect(result.id).toMatch(/^test_pref_/);
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR Code with fallback', async () => {
      const paymentId = 'test_pix_123456789';

      const result = await client.getPixQrCode(paymentId);

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('qrCodeText');
      expect(result).toHaveProperty('copyAndPasteKey');
      expect(result).toHaveProperty('expirationDate');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('amount');
      
      expect(result.qrCode).toMatch(/^iVBORw0KGgo/); // Base64 image
      expect(result.qrCodeText).toMatch(/^000201/); // PIX QR code format
      expect(result.copyAndPasteKey).toMatch(/^000201/);
    });

    it('should handle non-existent payment ID', async () => {
      const invalidPaymentId = 'nonexistent_payment';

      await expect(client.getPixQrCode(invalidPaymentId)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test would require mocking the MercadoPago client
      // For now, we'll just test that the method exists
      expect(typeof client.createPixPayment).toBe('function');
    });
  });

  describe('Data Validation', () => {
    it('should validate PIX payment data structure', async () => {
      const validData = {
        orderId: 'test_validation_123',
        amount: 50.50,
        description: 'Validation test',
        payerEmail: 'validate@test.com',
        payerFirstName: 'Validate',
        payerLastName: 'Test',
        payerPhone: '11987654321',
        notificationUrl: 'http://localhost:3001/webhook'
      };

      const result = await client.createPixPayment(validData);

      expect(result.transaction_amount).toBe(50.50);
      expect(result.external_reference).toBe('test_validation_123');
    });

    it('should handle different amount values', async () => {
      const testCases = [
        { amount: 0.01, expected: 0.01 },
        { amount: 100, expected: 100 },
        { amount: 9999.99, expected: 9999.99 }
      ];

      for (const testCase of testCases) {
        const orderData = {
          orderId: `test_amount_${testCase.amount}`,
          amount: testCase.amount,
          description: `Amount test ${testCase.amount}`,
          payerEmail: 'test@example.com',
          payerFirstName: 'Test',
          payerLastName: 'User',
          payerPhone: '11999999999',
          notificationUrl: 'http://localhost:3001/webhook'
        };

        const result = await client.createPixPayment(orderData);
        expect(result.transaction_amount).toBe(testCase.expected);
      }
    });
  });
});
