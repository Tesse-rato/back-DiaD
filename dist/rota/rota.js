"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Rota {
    dispensa(resp, next) {
        return (documento) => {
            resp.json(documento);
            return next();
        };
    }
}
exports.Rota = Rota;
