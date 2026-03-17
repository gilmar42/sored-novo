import { Router } from 'express';
import { 
  createPayment, 
  getPayment, 
  refundPayment, 
  createCheckoutSession, 
  getPaymentStatus, 
  getPublicKey,
  createPixPayment,
  getPixQrCode,
  getPixStatus
} from '../payments/controllers/paymentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validatePixPayment, validatePixStatus } from '../middleware/validationPix';

const router = Router();

// Rota pública para ler a chave no frontend
router.get('/public-key', getPublicKey);

// Rotas exclusivas de PIX e Checkout (Sem autenticação obrigatória para Checkout Público)
router.post('/pix/create', optionalAuthenticate, validatePixPayment, createPixPayment);
router.get('/pix/qrcode/:paymentId', optionalAuthenticate, validatePixStatus, getPixQrCode);
router.get('/pix/status/:paymentId', optionalAuthenticate, validatePixStatus, getPixStatus);
router.post('/checkout', optionalAuthenticate, createCheckoutSession);
router.post('/checkout-enhanced', optionalAuthenticate, createCheckoutSession);
router.get('/status/:paymentId', optionalAuthenticate, getPaymentStatus);

// Todasa as rotas abaixo precisam de autenticação
router.use(authenticate);

// Rotas exclusivas de pagamento interno
router.post('/', createPayment);
router.get('/:id', getPayment);
router.post('/:id/refund', refundPayment);

export default router;