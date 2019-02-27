const express = require('express')();
const bodyParser = require('body-parser');

const middlewareAuth = require('./middleware/auth');
const env = require('./environment');

const userRoutes = require('./routes/user');

express.use(bodyParser.json());
express.use(middlewareAuth);

express.use('/users', userRoutes);

express.listen(process.env.PORT || env.port, () => {
  console.clear();
  console.log('Servidor rodando com sucesso');
});
