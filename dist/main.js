"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server/server");
const rotas_usuario_1 = require("./usuarios/rotas.usuario");
const rota_empresa_1 = require("./empresa/rota.empresa");
const rotasStaticas_1 = require("./serverStatico/rotasStaticas");
const Server = new server_1.servidor();
Server.gatilho([rotas_usuario_1.RotasUsuarios, rota_empresa_1.RotasEmpresa, rotasStaticas_1.RotasStatica]).then((servidor) => {
    console.log('Montado com Sucesso');
    console.log(servidor.servidor.address());
    console.log('\n\n');
}).catch(erro => {
    console.error(erro);
    console.log('Erro na criacao do servidor');
    process.exit(1);
});
