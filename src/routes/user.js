const route = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const middlewareAuth = require('../middleware/auth');
const env = require('../environment/index');

const generateToken = (params = {}, cb) => {
  jwt.sign(params, env.secretKey, {
    expiresIn: 86400
  }, cb);
};

/**
 * validdadeUser retorna uma promise
 * validadeUser desestrura o form enviado pelo front
 * caso a entrada do usuário estiver faltando algum item obrigatório
 * reject é invocado e a é retornado um erro por usuário
 */
const validateUser = (form = {}) => {
  return new Promise((resolve, reject) => {
    const {
      name: { first, last, nickname },
      email,
      password,
      confirmPassword
    } = form;

    if (first && last && nickname && email && password && confirmPassword) {
      if (password === confirmPassword) {
        resolve(email);
      } else
        reject({ error: 'Password not match' });
    } else if (!email) {
      reject({ erro: 'Email not provided' });
    } else if (!password || !confirmPassword) {
      reject({ erro: 'PassWord or ConfirmPassWord not provided' });
    } else if (!first) {
      reject({ erro: 'First name not provided' });
    } else if (!last) {
      reject({ erro: 'Last name not provided' });
    } else if (!nickname) {
      reject({ erro: 'Nickname name not provided' });
    }
  });
};

route.get('/list', (req, res) => {
  User.find().then((users) => {
    res.send({ users });
  });
});

/**
 * Create User primeiro confirma os campos preenchidos
 * Após verifica no banco de dados se aquele email já esta cadastrado
 * Se passar pelas confirmação o email com seus dados é inserido no banco de dados
 */
route.post('/create', (req, res) => {
  validateUser(req.body).then((email) => {
    User.findOne({ email }).then((user) => {
      if (user) {
        return res.status(400).send({ error: 'User already exists' });
      }
      User.create(req.body).then((user) => {
        user.password = undefined;
        generateToken({ id: user._id }, (err, token) => {
          if (err) {
            return res.status(400).send({ error: 'Error on generate token' });
          }
          res.status(201).send({ user, token });
        });
      }).catch(err => {
        res.status(500).send({ error: 'Error on create user' });
      });
    });
  }).catch(err => {
    res.status(400).send(err);
  });
});

/**
 * Auth primeiro verifica se o usuário foreneceu os dados necessarios
 * Se sim confere no banco se o usuario existe
 * Se sim bcrypt compara a senha com o hash do banco de dados
 * Se ok o usuario recebe um token valido por 1 dia
 */
route.post('/auth', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    if (!email) {
      return res.send({ error: 'Email not provide' });
    } else if (!password) {
      return res.send({ error: 'Password not provide' });
    }
  }
  User.findOne({ email }).select('+password').then((user) => {
    if (!user) {
      return res.status(400).send({ error: 'User not found' });
    }
    bcrypt.compare(password, user.password, (err, resultado) => {
      if (err) {
        return res.status(401).send({ error: 'Error login, try again' });
      } else if (!resultado) {
        return res.status(401).send({ error: 'Invalid password' })
      }
      user.password = undefined;

      generateToken({ id: user._id }, (err, token) => {
        if (err) return res.status(400).send({ erro: 'Error on generate token' });
        res.send({ user, token });
      });
    });
  });
});

route.delete('/remove/all', (req, res) => {
  User.deleteMany({}).then(() => {
    res.send({ remove: 'all' });
  });
});

module.exports = route;