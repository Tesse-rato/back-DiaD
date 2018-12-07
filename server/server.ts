import * as restify from 'restify'
import * as mongoose from 'mongoose'

import {Rota} from '../rota/rota'
import {enviroment} from '../ambiente/ambiente'

class Servidor {
    servidor : restify.Server

    inicializaBanco(){
        console.log('inicializando banco de dados '+ enviroment.db.url)
        return mongoose.connect(enviroment.db.url,{
            useNewUrlParser: true
        })
    }

    inicializaServidor(rotas: Rota[]): Promise<any>{
        return new Promise((resolve, rejects)=>{
            try{
                this.servidor= restify.createServer({
                    name: 'Servidor on Linux',
                    version:'1.0.0'
                })

                console.log('Inicializando Servidor ======= ', this.servidor.name+'\n'+this.servidor.versions)

                this.servidor.use(restify.plugins.queryParser())
                this.servidor.use(restify.plugins.jsonBodyParser())

                for ( let rota of rotas) {
                    rota.aplicaRotas(this.servidor)
                }

                this.servidor.listen(420,()=>{
                    console.log('Ouvindo')
                    resolve(this.servidor)
                })
            }
            catch(erro){
                rejects(erro)
            }
        })
    }

    gatilho(rotas: Rota[]=[]): Promise<Servidor>{
        return this.inicializaBanco().then(()=>this.inicializaServidor(rotas).then(()=>this))
    }
}

export const servidor = Servidor