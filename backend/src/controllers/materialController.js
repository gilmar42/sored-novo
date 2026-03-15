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
exports.deleteMaterial = exports.updateMaterial = exports.getMaterialById = exports.getMaterials = exports.createMaterial = void 0;
const Material_1 = __importDefault(require("../models/Material"));
const createMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { name, description, category, unitOfMeasure, unitCost, weight, weightUnit, dimensions, diameter, diameterUnit, volume, volumeUnit, isComposite, components, itemType, size } = req.body;
        const existingMaterial = yield Material_1.default.findOne({
            tenantId: req.tenant._id,
            name: name
        });
        if (existingMaterial) {
            res.status(400).json({ message: 'Material já cadastrado com este nome' });
            return;
        }
        const material = new Material_1.default({
            tenantId: req.tenant._id,
            name,
            description,
            category,
            unitOfMeasure,
            unitCost,
            weight,
            weightUnit,
            dimensions,
            diameter,
            diameterUnit,
            volume,
            volumeUnit,
            isComposite: isComposite || false,
            components: isComposite ? components : [],
            itemType: itemType || 'material',
            size
        });
        yield material.save();
        res.status(201).json({
            message: 'Material criado com sucesso',
            material
        });
    }
    catch (error) {
        console.error('Erro ao criar material:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.createMaterial = createMaterial;
const getMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const [materials, total] = yield Promise.all([
            Material_1.default.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Material_1.default.countDocuments(query)
        ]);
        const categories = yield Material_1.default.distinct('category', { tenantId: req.tenant._id, isActive: true });
        res.json({
            materials,
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
        console.error('Erro ao listar materiais:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getMaterials = getMaterials;
const getMaterialById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const material = yield Material_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!material) {
            res.status(404).json({ message: 'Material não encontrado' });
            return;
        }
        res.json({ material });
    }
    catch (error) {
        console.error('Erro ao obter material:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getMaterialById = getMaterialById;
const updateMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const material = yield Material_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!material) {
            res.status(404).json({ message: 'Material não encontrado' });
            return;
        }
        if (updateData.name && updateData.name !== material.name) {
            const existingMaterial = yield Material_1.default.findOne({
                tenantId: req.tenant._id,
                name: updateData.name,
                _id: { $ne: id }
            });
            if (existingMaterial) {
                res.status(400).json({ message: 'Nome já está em uso por outro material' });
                return;
            }
        }
        Object.assign(material, updateData);
        yield material.save();
        res.json({
            message: 'Material atualizado com sucesso',
            material
        });
    }
    catch (error) {
        console.error('Erro ao atualizar material:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateMaterial = updateMaterial;
const deleteMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const material = yield Material_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!material) {
            res.status(404).json({ message: 'Material não encontrado' });
            return;
        }
        material.isActive = false;
        yield material.save();
        res.json({ message: 'Material desativado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar material:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.deleteMaterial = deleteMaterial;
