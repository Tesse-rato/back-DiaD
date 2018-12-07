import {servidor} from './server/server'
import {RotasUsuarios} from './usuarios/rotas.usuario'
import {RotasEmpresa} from './empresa/rota.empresa'
import {RotasStatica} from './serverStatico/rotasStaticas'

const Server = new servidor()
Server.gatilho([RotasUsuarios, RotasEmpresa, RotasStatica]).then((servidor)=>{
    console.log('Montado com Sucesso')
    console.log(servidor.servidor.address())
    console.log('\n\n')
}).catch(erro=>{
    console.error(erro)
    console.log('Erro na criacao do servidor')
    process.exit(1)
})