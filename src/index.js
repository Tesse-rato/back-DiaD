const express = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

const middlewareAuth = require('./middleware');
const env = require('./environment');

const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');

express.use(cors());
express.use(bodyParser({ limit: '12MB' }));
express.use(bodyParser.json());
express.use(middlewareAuth);

express.use('/users', userRoutes);
express.use('/posts', postRoutes);

express.listen(process.env.PORT || env.port, () => {
  console.clear();
  console.log('Servidor rodando');
});
