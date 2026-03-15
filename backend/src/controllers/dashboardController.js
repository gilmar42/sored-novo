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
exports.getTopClients = exports.getRecentActivity = exports.getDashboardStats = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const Material_1 = __importDefault(require("../models/Material"));
const Labor_1 = __importDefault(require("../models/Labor"));
const Machine_1 = __importDefault(require("../models/Machine"));
const Budget_1 = __importDefault(require("../models/Budget"));
const User_1 = __importDefault(require("../models/User"));
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const [totalClients, totalMaterials, totalLabor, totalMachines, totalBudgets, totalUsers, budgetStats, recentBudgets, monthlyStats] = yield Promise.all([
            Client_1.default.countDocuments({ tenantId: req.tenant._id, isActive: true }),
            Material_1.default.countDocuments({ tenantId: req.tenant._id, isActive: true }),
            Labor_1.default.countDocuments({ tenantId: req.tenant._id, isActive: true }),
            Machine_1.default.countDocuments({ tenantId: req.tenant._id, isActive: true }),
            Budget_1.default.countDocuments({ tenantId: req.tenant._id }),
            User_1.default.countDocuments({ tenantId: req.tenant._id, isActive: true }),
            Budget_1.default.aggregate([
                { $match: { tenantId: req.tenant._id } },
                {
                    $group: {
                        _id: null,
                        totalValue: { $sum: '$totalPrice' },
                        draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                        approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                        rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        avgBudgetValue: { $avg: '$totalPrice' }
                    }
                }
            ]),
            Budget_1.default.find({ tenantId: req.tenant._id })
                .populate('clientId', 'name')
                .sort({ createdAt: -1 })
                .limit(5),
            Budget_1.default.aggregate([
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
            ])
        ]);
        const stats = budgetStats[0] || {
            totalValue: 0,
            draftCount: 0,
            sentCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            completedCount: 0,
            avgBudgetValue: 0
        };
        res.json({
            overview: {
                totalClients,
                totalMaterials,
                totalLabor,
                totalMachines,
                totalBudgets,
                totalUsers
            },
            budgetStats: stats,
            recentBudgets,
            monthlyStats: monthlyStats.map(stat => ({
                month: `${stat._id.month.toString().padStart(2, '0')}/${stat._id.year}`,
                count: stat.count,
                totalValue: stat.totalValue
            }))
        });
    }
    catch (error) {
        console.error('Erro ao obter estatísticas do dashboard:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getDashboardStats = getDashboardStats;
const getRecentActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const limit = parseInt(req.query.limit) || 10;
        const [recentBudgets, recentClients] = yield Promise.all([
            Budget_1.default.find({ tenantId: req.tenant._id })
                .populate('clientId', 'name')
                .sort({ createdAt: -1 })
                .limit(limit),
            Client_1.default.find({ tenantId: req.tenant._id })
                .sort({ createdAt: -1 })
                .limit(limit)
        ]);
        const activities = [
            ...recentBudgets.map(budget => ({
                type: 'budget',
                id: budget._id,
                title: `Orçamento ${budget.number}`,
                description: budget.title,
                status: budget.status,
                createdAt: budget.createdAt,
                clientName: budget.clientId.name
            })),
            ...recentClients.map(client => ({
                type: 'client',
                id: client._id,
                title: 'Novo Cliente',
                description: client.name,
                status: 'active',
                createdAt: client.createdAt,
                clientName: client.name
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        res.json({ activities });
    }
    catch (error) {
        console.error('Erro ao obter atividades recentes:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getRecentActivity = getRecentActivity;
const getTopClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const topClients = yield Budget_1.default.aggregate([
            { $match: { tenantId: req.tenant._id } },
            {
                $group: {
                    _id: '$clientId',
                    totalBudgets: { $sum: 1 },
                    totalValue: { $sum: '$totalPrice' },
                    avgBudgetValue: { $avg: '$totalPrice' }
                }
            },
            { $sort: { totalValue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $unwind: '$client' },
            {
                $project: {
                    clientId: '$_id',
                    clientName: '$client.name',
                    clientEmail: '$client.email',
                    totalBudgets: 1,
                    totalValue: 1,
                    avgBudgetValue: 1
                }
            }
        ]);
        res.json({ topClients });
    }
    catch (error) {
        console.error('Erro ao obter top clientes:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getTopClients = getTopClients;
