"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mercadoPagoWebhookHandler = require("../webhooks/mercadoPagoWebhookHandler");
const router = express.Router();
router.post('/mercadopago', mercadoPagoWebhookHandler.handleMercadoPagoWebhook);
exports.default = router;
