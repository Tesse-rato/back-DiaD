const jwt = require('jsonwebtoken');
const env = require('../environment/index');

module.exports = function authorization(req, res, next) {
  console.log(req.path, ' - Passou por token');
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
  });
}