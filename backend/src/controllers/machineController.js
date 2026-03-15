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
exports.deleteMachine = exports.updateMachine = exports.getMachineById = exports.getMachines = exports.createMachine = void 0;
const Machine_1 = __importDefault(require("../models/Machine"));
const createMachine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { name, description, costPerHour, energyCost, maintenanceCost, category, specifications } = req.body;
        const existingMachine = yield Machine_1.default.findOne({
            tenantId: req.tenant._id,
            name: name
        });
        if (existingMachine) {
            res.status(400).json({ message: 'Máquina já cadastrada com este nome' });
            return;
        }
        const machine = new Machine_1.default({
            tenantId: req.tenant._id,
            name,
            description,
            costPerHour,
            energyCost,
            maintenanceCost,
            category,
            specifications
        });
        yield machine.save();
        res.status(201).json({
            message: 'Máquina criada com sucesso',
            machine
        });
    }
    catch (error) {
        console.error('Erro ao criar máquina:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.createMachine = createMachine;
const getMachines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const [machines, total] = yield Promise.all([
            Machine_1.default.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Machine_1.default.countDocuments(query)
        ]);
        const categories = yield Machine_1.default.distinct('category', { tenantId: req.tenant._id, isActive: true });
        res.json({
            machines,
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
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getMachines = getMachines;
const getMachineById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const machine = yield Machine_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!machine) {
            res.status(404).json({ message: 'Máquina não encontrada' });
            return;
        }
        res.json({ machine });
    }
    catch (error) {
        console.error('Erro ao obter máquina:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getMachineById = getMachineById;
const updateMachine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const machine = yield Machine_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!machine) {
            res.status(404).json({ message: 'Máquina não encontrada' });
            return;
        }
        if (updateData.name && updateData.name !== machine.name) {
            const existingMachine = yield Machine_1.default.findOne({
                tenantId: req.tenant._id,
                name: updateData.name,
                _id: { $ne: id }
            });
            if (existingMachine) {
                res.status(400).json({ message: 'Nome já está em uso por outra máquina' });
                return;
            }
        }
        Object.assign(machine, updateData);
        yield machine.save();
        res.json({
            message: 'Máquina atualizada com sucesso',
            machine
        });
    }
    catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateMachine = updateMachine;
const deleteMachine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const machine = yield Machine_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!machine) {
            res.status(404).json({ message: 'Máquina não encontrada' });
            return;
        }
        machine.isActive = false;
        yield machine.save();
        res.json({ message: 'Máquina desativada com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar máquina:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.deleteMachine = deleteMachine;
