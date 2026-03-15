import { Router } from 'express';
import { 
  getDashboardStats, 
  getRecentActivity, 
  getTopClients 
} from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', 
  authenticate, 
  authorize(['reports:read']), 
  getDashboardStats
);

router.get('/activity', 
  authenticate, 
  authorize(['reports:read']), 
  getRecentActivity
);

router.get('/top-clients', 
  authenticate, 
  authorize(['reports:read']), 
  getTopClients
);

export default router;
