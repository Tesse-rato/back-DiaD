"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rota_1 = require("../rota/rota");
const modelo_empresa_1 = require("./modelo.empresa");
class RotaEmpresa extends rota_1.Rota {
    aplicaRotas(servidor) {
        servidor.get('/empresas', (req, resp, next) => {
            modelo_empresa_1.ModeloEmpresa.find().then((documentos) => {
                resp.json(documentos);
                return next();
            });
        });
        servidor.get('/empresa/:id', (req, resp, next) => {
            modelo_empresa_1.ModeloEmpresa.findById({ _id: req.params.id }).then((document) => {
                resp.json(document);
                return next();
            });
        });
        servidor.post('/empresas', (req, resp, next) => {
            modelo_empresa_1.ModeloEmpresa.create(req.body).then((documento) => {
                resp.json(documento);
                return next();
            });
        });
        servidor.del('/empresa/:id', (req, resp, next) => {
            modelo_empresa_1.ModeloEmpresa.findOneAndDelete({ _id: req.params.id }).then((documento) => {
                resp.json(documento);
                return next();
            }).catch(erro => {
                resp.json(erro);
                return next();
            });
        });
    }
}
exports.RotasEmpresa = new RotaEmpresa();
