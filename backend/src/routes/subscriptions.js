"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.default.Router)();
// Planos e status são públicos para desenvolvimento
router.get('/plans', subscriptionController_1.getSubscriptionPlans);
router.get('/status', subscriptionController_1.getSubscriptionStatus);
router.post('/', auth_1.authenticate, subscriptionController_1.createSubscription);
router.get('/', auth_1.authenticate, subscriptionController_1.getSubscription);
router.put('/', auth_1.authenticate, subscriptionController_1.updateSubscription);
router.delete('/', auth_1.authenticate, subscriptionController_1.cancelSubscription);
exports.default = router;
