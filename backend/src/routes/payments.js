"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../payments/controllers/paymentController");
const auth_1 = require("../middleware/auth");
const validationPix_1 = require("../middleware/validationPix");
const router = (0, express_1.default.Router)();
// Rota pública para ler a chave no frontend
router.get('/public-key', paymentController_1.getPublicKey);
// Rotas exclusivas de PIX e Checkout (Sem autenticação obrigatória para Checkout Público)
router.post('/pix/create', auth_1.optionalAuthenticate, validationPix_1.validatePixPayment, paymentController_1.createPixPayment);
router.get('/pix/qrcode/:paymentId', auth_1.optionalAuthenticate, validationPix_1.validatePixStatus, paymentController_1.getPixQrCode);
router.get('/pix/status/:paymentId', auth_1.optionalAuthenticate, validationPix_1.validatePixStatus, paymentController_1.getPixStatus);
router.post('/checkout', auth_1.optionalAuthenticate, paymentController_1.createCheckoutSession);
router.post('/checkout-enhanced', auth_1.optionalAuthenticate, paymentController_1.createCheckoutSession);
router.get('/status/:paymentId', auth_1.optionalAuthenticate, paymentController_1.getPaymentStatus);
// Todasa as rotas abaixo precisam de autenticação
router.use(auth_1.authenticate);
// Rotas exclusivas de pagamento interno
router.post('/', paymentController_1.createPayment);
router.get('/:id', paymentController_1.getPayment);
router.post('/:id/refund', paymentController_1.refundPayment);
exports.default = router;
