"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.servePDF = exports.downloadBudgetPDF = exports.generateBudgetPDFController = void 0;
const pdfGenerator_1 = require("../utils/pdfGenerator");
const Budget_1 = __importDefault(require("../models/Budget"));
const logger_1 = __importDefault(require("../utils/logger"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generateBudgetPDFController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        logger_1.default.info('Iniciando geração de PDF', {
            tenantId: (_a = req.tenant) === null || _a === void 0 ? void 0 : _a._id,
            budgetId: req.params.id,
            userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id
        });
        if (!req.tenant) {
            logger_1.default.warn('Tenant não encontrado na requisição', { userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id });
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const budget = yield Budget_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        logger_1.default.info('Budget consultado', { budgetId: id, found: !!budget });
        if (!budget) {
            logger_1.default.warn('Orçamento não encontrado', { budgetId: id, tenantId: req.tenant._id });
            res.status(404).json({ message: 'Orçamento não encontrado' });
            return;
        }
        logger_1.default.info('Gerando PDF para orçamento', { budgetId: id, budgetNumber: budget.number });
        const pdfBuffer = yield (0, pdfGenerator_1.generateBudgetPDF)(id);
        logger_1.default.info('PDF gerado com sucesso', { budgetId: id, size: pdfBuffer.length });
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `budget_${budget.number}_${Date.now()}.pdf`;
        const filePath = path_1.default.join(uploadsDir, fileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        budget.pdfPath = filePath;
        yield budget.save();
        // Gerar link para o PDF
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        const pdfUrl = `${baseUrl}/api/pdf/download/${fileName}`;
        logger_1.default.info('PDF salvo e URL gerada', { fileName, filePath, pdfUrl });
        res.json({
            message: 'PDF gerado com sucesso',
            pdfUrl,
            fileName: `orçamento_${budget.number}.pdf`
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao gerar PDF', {
            budgetId: req.params.id,
            tenantId: (_d = req.tenant) === null || _d === void 0 ? void 0 : _d._id,
            error: error === null || error === void 0 ? void 0 : error.message
        });
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.generateBudgetPDFController = generateBudgetPDFController;
const downloadBudgetPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        if (!req.tenant) {
            logger_1.default.warn('Tenant não encontrado na requisição de download', { userId: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id });
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const budget = yield Budget_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!budget || !budget.pdfPath) {
            logger_1.default.warn('PDF não encontrado', { budgetId: id, hasPdfPath: !!(budget === null || budget === void 0 ? void 0 : budget.pdfPath) });
            res.status(404).json({ message: 'PDF não encontrado' });
            return;
        }
        if (!fs_1.default.existsSync(budget.pdfPath)) {
            logger_1.default.error('Arquivo PDF não encontrado no sistema de arquivos', { filePath: budget.pdfPath });
            res.status(404).json({ message: 'Arquivo PDF não encontrado' });
            return;
        }
        logger_1.default.info('PDF sendo enviado', { budgetId: id, filePath: budget.pdfPath });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="orçamento_${budget.number}.pdf"`);
        res.sendFile(budget.pdfPath);
    }
    catch (error) {
        logger_1.default.error('Erro ao baixar PDF', {
            budgetId: req.params.id,
            error: error === null || error === void 0 ? void 0 : error.message
        });
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.downloadBudgetPDF = downloadBudgetPDF;
const servePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(process.cwd(), 'uploads', filename);
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.default.warn('Arquivo PDF solicitado não encontrado', { filename, filePath });
            res.status(404).json({ message: 'Arquivo não encontrado' });
            return;
        }
        // Verificar se o arquivo pertence ao tenant (opcional, por segurança)
        // Para simplificar, servir diretamente
        logger_1.default.info('PDF sendo servido', { filename, filePath });
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(filePath);
    }
    catch (error) {
        logger_1.default.error('Erro ao servir PDF', {
            filename: req.params.filename,
            error: error === null || error === void 0 ? void 0 : error.message
        });
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.servePDF = servePDF;
