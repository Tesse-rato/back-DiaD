import {Rota} from '../rota/rota'
import * as restify from 'restify'

export default class Staticas extends Rota {
    aplicaRotas(servidor: restify.Server){
        servidor.get('/*.[html]',restify.plugins.serveStatic({
	        directory: '/home/publico',
            default: 'index.html'
        }))
    }
}
 export const RotasStatica = new Staticas()
