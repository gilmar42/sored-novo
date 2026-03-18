"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mercadoPagoWebhookHandler_1 = require("../webhooks/mercadoPagoWebhookHandler");
const router = (0, express_1.default.Router)();
// Webhook do Mercado Pago - não requer autenticação
router.post('/mercadopago', mercadoPagoWebhookHandler_1.handleMercadoPagoWebhook);
exports.default = router;
