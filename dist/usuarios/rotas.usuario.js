"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rota_1 = require("../rota/rota");
const modelo_usuario_1 = require("./modelo.usuario");
class rotaUsuario extends rota_1.Rota {
    aplicaRotas(servidor) {
        servidor.get('/usuarios', (req, resp, next) => {
            console.log(req.connection.localAddress + " ---Conexao Local");
            console.log(req.headers.host + " ---IP EXTERNO DESTE HOST");
            console.log(req.socket.remotePort + " ---SocketRemotePort");
            console.log(req.socket.remoteAddress + " ---SocketRemoteAdress");
            console.log(req.socket.remoteFamily + " ---SocketRemoteFamilia");
            modelo_usuario_1.ModeloUsuario.find().then(this.dispensa(resp, next));
        });
        servidor.post('/usuarios', (req, resp, next) => {
            if (req.body) {
                console.log('Metodo POST ');
                console.log('Nome..: ' + req.body.nome);
                console.log('Senha.: ' + req.body.senha);
                console.log('Email.: ' + req.body.email);
                console.log('');
                modelo_usuario_1.ModeloUsuario.findOne({ email: req.body.email }).then((doc) => {
                    if (!doc) {
                        console.log(doc);
                        modelo_usuario_1.ModeloUsuario.create(req.body)
                            .then(this.dispensa(resp, next))
                            .catch(() => {
                            console.log('Email invalido');
                            resp.send(206);
                        });
                    }
                    else {
                        resp.send(226);
                        console.log('Usuario nao cadastrado');
                    }
                }).catch(erro => {
                    resp.send(400);
                });
            }
            else {
                console.log('Faltando campos no cadastro do usuario');
                resp.send(400);
            }
            return next();
        });
        servidor.post('/l/usuario', (req, resp, next) => {
            modelo_usuario_1.ModeloUsuario.findOne({ email: req.body.email }).then((doc) => {
                console.log('             -------------------------- LOGIN -------------------------- ');
                console.log('Nome......: ' + doc.nome);
                console.log('Sobrenome.: ' + doc.sobrenome);
                console.log('Email.....: ' + req.body.email);
                console.log('senha.....: ' + req.body.senha);
                if (doc.senha == req.body.senha) {
                    resp.statusCode = 200;
                    console.log('++++++++++++ logado ++++++++++++\n');
                }
                else {
                    resp.statusCode = 203;
                    console.log('!!!!!!!!!!!!! SENHA INCORRETA !!!!!!!!!!!!!');
                    console.log('!!!!!!!!!!!!! SENHA { ' + doc.senha + ' } !!!!!!!!!!!!!\n');
                }
                resp.send();
                return next();
            }).catch((erro) => {
                console.log('Email.....: ' + req.body.email);
                console.log('senha.....: ' + req.body.senha);
                console.log('             _____________ Email nao encontrado ______________\n');
                resp.send(206);
                return next();
            });
        });
        servidor.get('/usuario/:id', (req, resp, next) => {
            modelo_usuario_1.ModeloUsuario.findById(req.params.id).then(this.dispensa(resp, next));
        });
        servidor.del('/usuario/:id', (req, resp, next) => {
            modelo_usuario_1.ModeloUsuario.findByIdAndDelete({ _id: req.params.id }).then((usuario) => {
                console.log(usuario);
                if (usuario) {
                    resp.json(usuario);
                    return next();
                }
                else {
                    resp.send(404);
                    return next();
                }
            });
        });
    }
}
exports.RotasUsuarios = new rotaUsuario();
