import * as restify from 'restify'
import {Rota} from '../rota/rota'
import {ModeloEmpresa as Empresa} from './modelo.empresa'

class RotaEmpresa extends Rota {
    aplicaRotas(servidor: restify.Server){
        servidor.get('/empresas',(req,resp,next)=>{
            Empresa.find().then((documentos)=>{
                resp.json(documentos)
                return next()
            })
        })
        servidor.get('/empresa/:id',(req, resp, next)=>{
            Empresa.findById({_id: req.params.id}).then((document)=>{
                resp.json(document)
                return next()
            })
        })
        servidor.post('/empresas',(req, resp, next)=>{
            Empresa.create(req.body).then((documento)=>{
                resp.json(documento)
                return next()
            })
        })
        servidor.del('/empresa/:id',(req, resp, next)=>{
            Empresa.findOneAndDelete({_id: req.params.id}).then((documento)=>{
                resp.json(documento)
                return next()
            }).catch(erro=>{
                resp.json(erro)
                return next ()
            })
            
        })
    }
}

 export const RotasEmpresa = new RotaEmpresa()