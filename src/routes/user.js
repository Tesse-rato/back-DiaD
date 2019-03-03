const route = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const Post = require('../models/postModel');
const env = require('../environment/index');
const sendMail = require('../mail');

//------------------------------------------------------------------------------------//
/**
 * Generate token recebe o id do usúario como identificações futuruas ao token
 * recebe uma callback quando o token esta pronto
 */
const generateToken = (params = {}, cb) => {
  jwt.sign(params, env.secretKey, {
    expiresIn: '1d' /*86400*/
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

//------------------------------------------------------------------------------------//
/**
 * Apenas lista usuarios para testes na api
 */
route.get('/list', (req, res) => {
  User.find()/*.populate('posts')*/.select('+posts +password +tokenForgotPassword +tokenForgotExpires').then((users) => {
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

//------------------------------------------------------------------------------------//
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
        // jwt expired -> erro retornado quando expira o token
        //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjNzNjYTE0NGRhOTViMjc0NDg1NmFiYSIsImlhdCI6MTU1MTA5MzM1NiwiZXhwIjoxNTUxMTc5NzU2fQ.5pi3Hsgz5KWb55QPEjyq1lEX76xPALcfW7JV-Nv-re4 
      });
    });
  });
});

//------------------------------------------------------------------------------------//
/**
 * Users Forgot his Password
 * Recebe um e-mail de quem esta querendo recuperar a senha
 * É salvo no modelo do usuario um token de recuperação e um tempo limite
 * Após isso o certo e-mail recebe o token no seu respectivo e-mail e já pode ir pra proxima rota
 */
route.post('/forgot_password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email }).select('+password').then((user) => {
    if (user) {
      const token = crypto.randomBytes(32).toString('HEX');
      const date = new Date()
      date.setHours(date.getHours() + 1);
      const newUser = {
        __v: user.__v,
        _id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        tokenForgotPassword: token,
        tokenForgotExpires: date.toString()
      }
      User.findByIdAndUpdate({ _id: user.id }, newUser).then(() => {
        sendMail(user.email, token).then(info => {
          return res.send({ status: 'Success', info });
        }).catch(err => {
          return res.status(500).send({ error: 'Error on send e-mail, try again' });
        })
      }).catch(err => {
        return res.status(500).send({ error: 'Error in updating user token to reset password ' });
      })
    }
  }).catch(err => {
    res.status(400).send({ error: 'User not found ' });
  })
})

//------------------------------------------------------------------------------------//
/**
 * reset Password recebe um email e um token de recuperacao
 * Confirma se o usuario forneceu um token e uma nova senha
 * Se sim o email é procurado no banco de dados
 * Se encontrado o token e o tempo limite so conferidos
 * Se (token === user.token e tempoLimite < agora) => usuario é atualizado
 */
route.post('/reset_password', (req, res) => {
  const { token, email, password } = req.body;
  if (!token) return res.status(400).send({ error: 'Token no provided' });
  if (!password) return res.status(400).send({ error: 'Password not provided' });

  User.findOne({ email }).select('+password +tokenForgotPassword +tokenForgotExpires')
    .then((user) => {
      const date = new Date();
      date.setHours(date.getHours());

      if (user.tokenForgotPassword === token && user.tokenForgotExpires > date.toString()) {
        user.password = password;
        user.tokenForgotExpires = undefined;
        user.tokenForgotPassword = undefined;
        user.save(err => {
          if (err) return res.status(500).send({ error: 'Error on update user password, try again' });

          res.send({ status: 'User password has benn reset ' });
        })
      } else if (user.tokenForgotExpires > date.toString()) {
        res.status(400).send({ error: 'Token expired, get a new one' });
      } else {
        res.status(400).send({ error: 'Token Invalid' });
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(400).send({ error: 'User not found' });
    })
})

/**
 * Delete User recebe um USER_ID
 * Verifica na base se esse usuario existe e o deleta
 * O metodo delete retorna o usuario deletado
 * Itero pelo campo do posts do usuario deletado
 * Invoco o metodo delete do post passando os POST_ID que pertenciam aquele usuário
 */
route.delete('/delete/:id', (req, res) => {
  User.findByIdAndRemove({ _id: req.params.id }).then(user => {
    userPosts = user.posts;
    userPosts.map(post => {
      Post.findByIdAndRemove({ _id: post }).then(() => null);
    });
    return res.send();
  }).catch(err => {
    console.log(err);
    res.status(400).send({ error: 'User not found' });
  })
});

//------------------------------------------------------------------------------------//
route.delete('/delete_all', (req, res) => {
  User.deleteMany({}).then(() => {
    res.send({ remove: 'all' });
  });
});

module.exports = route;