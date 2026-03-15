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
exports.getBudgetStats = exports.deleteBudget = exports.updateBudget = exports.getBudgetById = exports.getBudgets = exports.createBudget = void 0;
const Budget_1 = __importDefault(require("../models/Budget"));
const Client_1 = __importDefault(require("../models/Client"));
const createBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { clientId, title, description, materials, labor, machines, freightCost, additionalCosts, marginPercentage, validityDays, observations } = req.body;
        const client = yield Client_1.default.findOne({ _id: clientId, tenantId: req.tenant._id });
        if (!client) {
            res.status(400).json({ message: 'Cliente não encontrado' });
            return;
        }
        // Generate next budget number scoped by tenant, ordering by creation date
        const generateBudgetNumber = (suffix = '') => __awaiter(void 0, void 0, void 0, function* () {
            const lastBudget = yield Budget_1.default.findOne({ tenantId: req.tenant._id })
                .sort({ createdAt: -1 })
                .select('number');
            let nextNumber = 1;
            if (lastBudget && lastBudget.number) {
                const match = lastBudget.number.match(/(\d+)(-\w+)?$/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            return `BUD-${String(nextNumber).padStart(6, '0')}${suffix}`;
        });
        let budgetNumber = yield generateBudgetNumber();
        // Check for unique conflict and retry with timestamp suffix
        const existing = yield Budget_1.default.findOne({ number: budgetNumber });
        if (existing) {
            budgetNumber = yield generateBudgetNumber(`-${Date.now()}`);
        }
        const budget = new Budget_1.default({
            tenantId: req.tenant._id,
            clientId,
            number: budgetNumber,
            title,
            description,
            materials,
            labor,
            machines,
            freightCost,
            additionalCosts,
            marginPercentage,
            validityDays,
            observations
        });
        yield budget.save();
        const populatedBudget = yield Budget_1.default.findById(budget._id)
            .populate('clientId', 'name email phone document')
            .populate('materials.materialId', 'name unitOfMeasure')
            .populate('labor.laborId', 'name')
            .populate('machines.machineId', 'name');
        res.status(201).json({
            message: 'Orçamento criado com sucesso',
            budget: populatedBudget
        });
    }
    catch (error) {
        console.error('Erro ao criar orçamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.createBudget = createBudget;
const getBudgets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const clientId = req.query.clientId || '';
        const query = {
            tenantId: req.tenant._id
        };
        if (search) {
            query.$or = [
                { number: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }
        if (clientId) {
            query.clientId = clientId;
        }
        const skip = (page - 1) * limit;
        const [budgets, total] = yield Promise.all([
            Budget_1.default.find(query)
                .populate('clientId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Budget_1.default.countDocuments(query)
        ]);
        res.json({
            budgets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Erro ao listar orçamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getBudgets = getBudgets;
const getBudgetById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const budget = yield Budget_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        })
            .populate('clientId', 'name email phone document address')
            .populate('materials.materialId', 'name unitOfMeasure')
            .populate('labor.laborId', 'name')
            .populate('machines.machineId', 'name');
        if (!budget) {
            res.status(404).json({ message: 'Orçamento não encontrado' });
            return;
        }
        res.json({ budget });
    }
    catch (error) {
        console.error('Erro ao obter orçamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getBudgetById = getBudgetById;
const updateBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const budget = yield Budget_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!budget) {
            res.status(404).json({ message: 'Orçamento não encontrado' });
            return;
        }
        if (updateData.clientId) {
            const client = yield Client_1.default.findOne({ _id: updateData.clientId, tenantId: req.tenant._id });
            if (!client) {
                res.status(400).json({ message: 'Cliente não encontrado' });
                return;
            }
        }
        Object.assign(budget, updateData);
        yield budget.save();
        const populatedBudget = yield Budget_1.default.findById(budget._id)
            .populate('clientId', 'name email phone document')
            .populate('materials.materialId', 'name unitOfMeasure')
            .populate('labor.laborId', 'name')
            .populate('machines.machineId', 'name');
        res.json({
            message: 'Orçamento atualizado com sucesso',
            budget: populatedBudget
        });
    }
    catch (error) {
        console.error('Erro ao atualizar orçamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateBudget = updateBudget;
const deleteBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const budget = yield Budget_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!budget) {
            res.status(404).json({ message: 'Orçamento não encontrado' });
            return;
        }
        yield Budget_1.default.findByIdAndDelete(id);
        res.json({ message: 'Orçamento excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.deleteBudget = deleteBudget;
const getBudgetStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const stats = yield Budget_1.default.aggregate([
            { $match: { tenantId: req.tenant._id } },
            {
                $group: {
                    _id: null,
                    totalBudgets: { $sum: 1 },
                    totalValue: { $sum: '$totalPrice' },
                    draftCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                    },
                    sentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                    },
                    approvedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                    },
                    rejectedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                    },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            }
        ]);
        const monthlyStats = yield Budget_1.default.aggregate([
            { $match: { tenantId: req.tenant._id } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);
        res.json({
            stats: stats[0] || {
                totalBudgets: 0,
                totalValue: 0,
                draftCount: 0,
                sentCount: 0,
                approvedCount: 0,
                rejectedCount: 0,
                completedCount: 0
            },
            monthlyStats
        });
    }
    catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getBudgetStats = getBudgetStats;
