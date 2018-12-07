import * as mongoose from 'mongoose'

const schema = new mongoose.Schema({
    empresa: String,
    nome: String,
    cidade: String,
    contato:{
        telefone: String,
        email: String
    },
    endereco:{
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
        data: {type: Date, default: Date.now}
    }
})

export const ModeloEmpresa = mongoose.model('Empresa', schema)