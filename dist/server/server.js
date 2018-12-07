"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const mongoose = require("mongoose");
const ambiente_1 = require("../ambiente/ambiente");
class Servidor {
    inicializaBanco() {
        console.log('inicializando banco de dados ' + ambiente_1.enviroment.db.url);
        return mongoose.connect(ambiente_1.enviroment.db.url, {
            useNewUrlParser: true
        });
    }
    inicializaServidor(rotas) {
        return new Promise((resolve, rejects) => {
            try {
                this.servidor = restify.createServer({
                    name: 'Servidor on Linux',
                    version: '1.0.0'
                });
                console.log('Inicializando Servidor ======= ', this.servidor.name + '\n' + this.servidor.versions);
                this.servidor.use(restify.plugins.queryParser());
                this.servidor.use(restify.plugins.jsonBodyParser());
                for (let rota of rotas) {
                    rota.aplicaRotas(this.servidor);
                }
                this.servidor.listen(420, () => {
                    console.log('Ouvindo');
                    resolve(this.servidor);
                });
            }
            catch (erro) {
                rejects(erro);
            }
        });
    }
    gatilho(rotas = []) {
        return this.inicializaBanco().then(() => this.inicializaServidor(rotas).then(() => this));
    }
}
exports.servidor = Servidor;
