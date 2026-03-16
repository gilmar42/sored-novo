import { Router } from 'express';
import {
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionPlans,
  getSubscriptionStatus
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Planos e status são públicos para desenvolvimento
router.get('/plans', getSubscriptionPlans);
router.get('/status', getSubscriptionStatus);
router.post('/', authenticate, createSubscription);
router.get('/', authenticate, getSubscription);
router.put('/', authenticate, updateSubscription);
router.delete('/', authenticate, cancelSubscription);

export default router;
