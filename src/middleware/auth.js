const jwt = require('jsonwebtoken');
const env = require('../environment/index');
const fs = require('fs');

module.exports = (req, res, next) => {
  const route = req.path;

  if (route === '/users/auth' ||
    route === '/users/create' ||
    route === '/users/forgot_password' ||
    route === '/users/reset_password'
  ) {
    console.log('Nao passou por token');
    return next();
  }
  else if (
    route === '/users/list' ||
    route === '/users/auth' ||
    route === '/posts/create' ||
    route === '/posts/push' ||
    route === '/posts/comment' ||
    route === '/posts/list' ||
    route === '/posts/delete/all' ||
    route === '/posts/delete/:id'
  ) {

    console.log('Passou por token');
    const { authorization } = req.headers;

    if (!authorization) return res.status(400).send({ error: 'No token povided' });

    const [bearer, token] = authorization.split(' ');

    if (bearer !== 'Bearer') return res.status(400).send({ error: 'Token malformatted' });

    jwt.verify(token, env.secretKey, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(400).send(err.message);
      }
      req.id = decoded.id;
      return next();
    })
  } else {
    const ip = req.connection.remoteAddress;
    const hours = new Date();
    const data = `${req.method} | ${ip} | ${route} | ${hours.toString()}\n`
    fs.appendFile('./log/blackList.log', data, (err) => {
      if (err) {
        console.log(err)
      }
      res.status(200).send({ message: `Seu ip está no .log ${ip}` });
    })
  }
}