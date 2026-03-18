"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./utils/logger"));
const auth_1 = __importDefault(require("./routes/auth"));
const clients_1 = __importDefault(require("./routes/clients"));
const materials_1 = __importDefault(require("./routes/materials"));
const labor_1 = __importDefault(require("./routes/labor"));
const machines_1 = __importDefault(require("./routes/machines"));
const budgets_1 = __importDefault(require("./routes/budgets"));
const pdf_1 = __importDefault(require("./routes/pdf"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const settings_1 = __importDefault(require("./routes/settings"));
const payments_1 = __importDefault(require("./routes/payments"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (process.env.NODE_ENV !== 'production') {
            const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (isLocal)
                return callback(null, true);
        }
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Middleware de logging HTTP
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        var _a, _b;
        const duration = Date.now() - start;
        logger_1.default.http('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            tenantId: (_b = req.tenant) === null || _b === void 0 ? void 0 : _b._id
        });
    });
    next();
});
(0, database_1.connectDB)();
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SORED Backend is running' });
});
// Endpoint para logs (apenas desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/logs', (req, res) => {
        try {
            const logFiles = fs_1.default.readdirSync(path_1.default.join(process.cwd(), 'logs'));
            const logs = {};
            logFiles.forEach((file) => {
                if (file.endsWith('.log')) {
                    const filePath = path_1.default.join(process.cwd(), 'logs', file);
                    const content = fs_1.default.readFileSync(filePath, 'utf8');
                    logs[file] = content.split('\n').slice(-50); // últimas 50 linhas
                }
            });
            res.json(logs);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao ler logs' });
        }
    });
}
app.use('/api/auth', auth_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/materials', materials_1.default);
app.use('/api/labor', labor_1.default);
app.use('/api/machines', machines_1.default);
app.use('/api/budgets', budgets_1.default);
app.use('/api/pdf', pdf_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
// Middleware de tratamento de erro global
app.use((err, req, res, next) => {
    logger_1.default.error('Erro não tratado', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Ocorreu um erro interno no servidor.'
        : err.message || 'Erro interno do servidor';
    res.status(status).json({
        status: 'error',
        message
    });
});
app.listen(PORT, () => {
    logger_1.default.info('SORED Backend iniciado', { port: PORT, environment: process.env.NODE_ENV });
});
exports.default = app;
