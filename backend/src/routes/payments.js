"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const paymentController = require("../payments/controllers/paymentController");
const auth = require("../middleware/auth");
const validationPix = require("../middleware/validationPix");

const router = express.Router();

// Rota pública para ler a chave no frontend
router.get('/public-key', paymentController.getPublicKey);

// Rotas exclusivas de PIX e Checkout (Sem autenticação obrigatória para Checkout Público)
router.post('/pix/create', auth.optionalAuthenticate, validationPix.validatePixPayment, paymentController.createPixPayment);
router.get('/pix/qrcode/:paymentId', auth.optionalAuthenticate, validationPix.validatePixStatus, paymentController.getPixQrCode);
router.get('/pix/status/:paymentId', auth.optionalAuthenticate, validationPix.validatePixStatus, paymentController.getPixStatus);
router.post('/checkout', auth.optionalAuthenticate, paymentController.createCheckoutSession);
router.post('/checkout-enhanced', auth.optionalAuthenticate, paymentController.createCheckoutSession);
router.get('/status/:paymentId', auth.optionalAuthenticate, paymentController.getPaymentStatus);

// Todas as rotas abaixo precisam de autenticação
router.use(auth.authenticate);

// Rotas exclusivas de pagamento interno
router.post('/', paymentController.createPayment);
router.get('/:id', paymentController.getPayment);
router.post('/:id/refund', paymentController.refundPayment);

exports.default = router;
