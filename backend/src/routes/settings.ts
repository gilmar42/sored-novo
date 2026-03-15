import { Router } from 'express';
import { 
  getSettings, 
  updateSettings, 
  uploadLogo, 
  getSubscriptionInfo 
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  }
});

const router = Router();

router.get('/', 
  authenticate, 
  authorize(['settings:read']), 
  getSettings
);

router.put('/', 
  authenticate, 
  authorize(['settings:write']), 
  [
    body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('settings.defaultMargin').optional().isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    body('settings.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Moeda deve ter 3 caracteres'),
    validateRequest
  ], 
  updateSettings
);

router.post('/logo', 
  authenticate, 
  authorize(['settings:write']), 
  upload.single('logo'), 
  uploadLogo
);

router.get('/subscription', 
  authenticate, 
  authorize(['settings:read']), 
  getSubscriptionInfo
);

export default router;
