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
exports.deleteClient = exports.updateClient = exports.getClientById = exports.getClients = exports.createClient = void 0;
const Client_1 = __importDefault(require("../models/Client"));
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { name, email, phone, document, address, observations } = req.body;
        const existingClient = yield Client_1.default.findOne({
            tenantId: req.tenant._id,
            email: email
        });
        if (existingClient) {
            res.status(400).json({ message: 'Cliente já cadastrado com este email' });
            return;
        }
        const client = new Client_1.default({
            tenantId: req.tenant._id,
            name,
            email,
            phone,
            document,
            address,
            observations
        });
        yield client.save();
        res.status(201).json({
            message: 'Cliente criado com sucesso',
            client
        });
    }
    catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.createClient = createClient;
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const isActive = req.query.isActive === 'false' ? false : true;
        const query = {
            tenantId: req.tenant._id,
            isActive
        };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { document: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (page - 1) * limit;
        const [clients, total] = yield Promise.all([
            Client_1.default.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Client_1.default.countDocuments(query)
        ]);
        res.json({
            clients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getClients = getClients;
const getClientById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const client = yield Client_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!client) {
            res.status(404).json({ message: 'Cliente não encontrado' });
            return;
        }
        res.json({ client });
    }
    catch (error) {
        console.error('Erro ao obter cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.getClientById = getClientById;
const updateClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const updateData = req.body;
        const client = yield Client_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!client) {
            res.status(404).json({ message: 'Cliente não encontrado' });
            return;
        }
        if (updateData.email && updateData.email !== client.email) {
            const existingClient = yield Client_1.default.findOne({
                tenantId: req.tenant._id,
                email: updateData.email,
                _id: { $ne: id }
            });
            if (existingClient) {
                res.status(400).json({ message: 'Email já está em uso por outro cliente' });
                return;
            }
        }
        Object.assign(client, updateData);
        yield client.save();
        res.json({
            message: 'Cliente atualizado com sucesso',
            client
        });
    }
    catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.updateClient = updateClient;
const deleteClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.tenant) {
            res.status(401).json({ message: 'Tenant não encontrado' });
            return;
        }
        const { id } = req.params;
        const client = yield Client_1.default.findOne({
            _id: id,
            tenantId: req.tenant._id
        });
        if (!client) {
            res.status(404).json({ message: 'Cliente não encontrado' });
            return;
        }
        client.isActive = false;
        yield client.save();
        res.json({ message: 'Cliente desativado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao desativar cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.deleteClient = deleteClient;
