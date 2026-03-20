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
  getPixStatus,
  createPreApproval
} from '../payments/controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validatePixPayment, validatePixStatus } from '../middleware/validationPix';

const router = Router();

// Rota pública para ler a chave no frontend
router.get('/public-key', getPublicKey);

// Rotas exclusivas de PIX e Checkout (Sem autenticação obrigatória para Checkout Público)
router.post('/pix/create', validatePixPayment, createPixPayment);
router.get('/pix/qrcode/:paymentId', validatePixStatus, getPixQrCode);
router.get('/pix/status/:paymentId', validatePixStatus, getPixStatus);
router.post('/checkout', createCheckoutSession);
router.get('/status/:paymentId', getPaymentStatus);
router.post('/preapproval/create', createPreApproval);

// Todasa as rotas abaixo precisam de autenticação
router.use(authenticate);

// Rotas exclusivas de pagamento interno
router.post('/', createPayment);
router.get('/:id', getPayment);
router.post('/:id/refund', refundPayment);

export default router;