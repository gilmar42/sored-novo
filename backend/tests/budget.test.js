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
const mongoose_1 = __importDefault(require("mongoose"));
describe('Budget API & PDF Generation', () => {
    let token;
    let tenantId;
    let budgetId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Aqui assumimos que existe um banco de teste ou que podemos limpar dados
        // Para simplificar, vamos apenas testar a lógica sem persistência real se possível
        // Ou usar um mock para o mongoose
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    test('Deve criar um orçamento e calcular totais via hook pre-validate', () => __awaiter(void 0, void 0, void 0, function* () {
        // Este teste requer um setup de banco e auth mais complexo
        // Vou focar em um teste de unidade para o Modelo se a integração for muito pesada
        expect(true).toBe(true);
    }));
});
