"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const validation_1 = require("../middleware/validation");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
    }
});
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['settings:read']), settingsController_1.getSettings);
router.put('/', auth_1.authenticate, (0, auth_1.authorize)(['settings:write']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('settings.defaultMargin').optional().isFloat({ min: 0, max: 100 }).withMessage('Margem deve estar entre 0 e 100'),
    (0, express_validator_1.body)('settings.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Moeda deve ter 3 caracteres'),
    validation_1.validateRequest
], settingsController_1.updateSettings);
router.post('/logo', auth_1.authenticate, (0, auth_1.authorize)(['settings:write']), upload.single('logo'), settingsController_1.uploadLogo);
router.get('/subscription', auth_1.authenticate, (0, auth_1.authorize)(['settings:read']), settingsController_1.getSubscriptionInfo);
exports.default = router;
