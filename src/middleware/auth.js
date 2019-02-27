const jwt = require('jsonwebtoken');
const env = require('../environment/index');

module.exports = (req, res, next) => {
  const route = req.path;
  if (route === '/users/auth' || route === '/users/create') {
    return next();
  }
  const { authorization } = req.headers;

  if (!authorization) return res.status(400).send({ error: 'No token povided' });

  const [bearer, token] = authorization.split(' ');

  if (bearer !== 'Bearer') return res.status(400).send({ error: 'Token malformatted' });

  jwt.verify(token, env.secretKey, (err, decoded) => {
    if (err) return res.status(400).send(err.message);
    req.body.tokenId = decoded.id;
    return next();
  })

}