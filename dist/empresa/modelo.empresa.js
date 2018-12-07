"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    empresa: String,
    nome: String,
    cidade: String,
    contato: {
        telefone: String,
        email: String
    },
    endereco: {
        bairro: String,
        rua: String,
        numero: String
    },
    prestacao: [{
            tipo: String,
            nome: String,
            preco: String,
            descricao: String
        }],
    comentarios: {
        comentario: String,
        data: { type: Date, default: Date.now }
    }
});
exports.ModeloEmpresa = mongoose.model('Empresa', schema);
