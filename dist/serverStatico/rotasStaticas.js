"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rota_1 = require("../rota/rota");
const restify = require("restify");
class Staticas extends rota_1.Rota {
    aplicaRotas(servidor) {
        servidor.get('/*.[html]', restify.plugins.serveStatic({
            directory: '/home/publico',
            default: 'index.html'
        }));
    }
}
exports.default = Staticas;
exports.RotasStatica = new Staticas();
