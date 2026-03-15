import { Router } from 'express';
import { 
  generateBudgetPDFController, 
  downloadBudgetPDF,
  servePDF
} from '../controllers/pdfController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/generate/:id', 
  authenticate, 
  authorize(['budgets:read']), 
  generateBudgetPDFController
);

router.post('/budgets/:id/generate', 
  authenticate, 
  authorize(['budgets:read']), 
  generateBudgetPDFController
);

router.get('/budgets/:id/download', 
  authenticate, 
  authorize(['budgets:read']), 
  downloadBudgetPDF
);

router.get('/download/:filename', 
  authenticate, 
  servePDF
);

export default router;
