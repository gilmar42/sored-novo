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
exports.deleteLabor = exports.updateLabor = exports.getLaborById = exports.getLabors = exports.createLabor = void 0;
const Labor_1 = __importDefault(require("../models/Labor"));
const createLabor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { name, description, costPerHour, category } = req.body;
        const existingLabor = yield Labor_1.default.findOne({
            tenantId: req.tenant._id,
            name: name
        });
        if (existingLabor) {
            res.status(400).json({ message: 'Função já cadastrada com este nome' });
            return;
        }
        const labor = new Labor_1.default({
            tenantId: req.tenant._id,
            name,
            description,
            costPerHour,
            category
        });
        yield labor.save();
        res.status(201).json({
            message: 'Função criada com sucesso',
            labor
        });
    }
    catch (error) {
        console.error('Erro ao criar função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.createLabor = createLabor;
const getLabors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const isActive = req.query.isActive === 'false' ? false : true;
        const query = {
            tenantId: req.tenant._id,
            isActive
        };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) {
            query.category = category;
        }
        const skip = (page - 1) * limit;
        const [labors, total] = yield Promise.all([
            Labor_1.default.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Labor_1.default.countDocuments(query)
        ]);
        const categories = yield Labor_1.default.distinct('category', { tenantId: req.tenant._id, isActive: true });
        res.json({
            labors,
            categories,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Erro ao listar funções:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getLabors = getLabors;
const getLaborById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const labor = yield Labor_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!labor) {
            res.status(404).json({ message: 'Função não encontrada' });
            return;
        }
        res.json({ labor });
    }
    catch (error) {
        console.error('Erro ao obter função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getLaborById = getLaborById;
const updateLabor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const labor = yield Labor_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!labor) {
            res.status(404).json({ message: 'Função não encontrada' });
            return;
        }
        if (updateData.name && updateData.name !== labor.name) {
            const existingLabor = yield Labor_1.default.findOne({
                tenantId: req.tenant._id,
                name: updateData.name,
                _id: { $ne: id }
            });
            if (existingLabor) {
                res.status(400).json({ message: 'Nome já está em uso por outra função' });
                return;
            }
        }
        Object.assign(labor, updateData);
        yield labor.save();
        res.json({
            message: 'Função atualizada com sucesso',
            labor
        });
    }
    catch (error) {
        console.error('Erro ao atualizar função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateLabor = updateLabor;
const deleteLabor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const labor = yield Labor_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!labor) {
            res.status(404).json({ message: 'Função não encontrada' });
            return;
        }
        labor.isActive = false;
        yield labor.save();
        res.json({ message: 'Função desativada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar função:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.deleteLabor = deleteLabor;
