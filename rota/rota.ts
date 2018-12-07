import * as restify from 'restify'

export abstract class Rota{
    abstract aplicaRotas(servidor: restify.Server)
    
    dispensa(resp: restify.Response, next: restify.Next){
        return (documento) =>{
            resp.json(documento)
            return next()
        }
    }
}