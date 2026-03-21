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
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sored';
        yield mongoose_1.default.connect(mongoURI, {
        // These options are no longer needed in Mongoose 7.x but kept for reference
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        });
        logger_1.default.info('MongoDB conectado com sucesso', { uri: mongoURI.replace(/\/\/.*@/, '//***:***@') });
    }
    catch (error) {
        logger_1.default.error('Erro ao conectar ao MongoDB', { error: error === null || error === void 0 ? void 0 : error.message });
        process.exit(1);
    }
});
exports.connectDB = connectDB;
mongoose_1.default.connection.on('error', (err) => {
    logger_1.default.error('Erro de conexão MongoDB', { error: err.message });
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.default.info('MongoDB desconectado');
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    logger_1.default.info('MongoDB desconectado pelo término da aplicação');
    process.exit(0);
}));
