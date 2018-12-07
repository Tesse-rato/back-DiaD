"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongosse = require("mongoose");
const schema = new mongosse.Schema({
    nome: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    },
    email: {
        type: String,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalido'],
        required: true
    }
});
exports.ModeloUsuario = mongosse.model('Usuario', schema);
