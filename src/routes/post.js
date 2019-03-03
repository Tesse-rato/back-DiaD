const route = require('express').Router();
const Post = require('../models/postModel');
const User = require('../models/userModel');

/**
 * Criando um post recebe um USER_ID para assinar ao post
 * Primeiro valida se todas entradas foram recebidas antes de levar ao banco
 * Busca no banco pelo ID fornecido, se existir ele tenta criar um novo Post
 * Ao sucesso da criação do post o usuario é atualizado com o ID retornado...
 */
route.post('/create', (req, res) => {
  const { assignedTo, content } = req.body;
  if (!assignedTo) return res.status(400).send({ error: 'No User provided' });
  if (!content) return res.status(400).send({ error: 'Content is required' });
  User.findById({ _id: assignedTo }).then(user => {
    Post.create({ assignedTo, content }).then(post => {
      const posts = user.posts;
      posts.push(post._id);
      user.updateOne({ posts }, (err) => {
        if (err) return res.status(500).send({ error: 'Error on user update, try again' });
        res.send();
      });
    }).catch(err => {
      console.log(err);
      res.status(500).send({ error: 'Error on post create, try again' });
    });
  }).catch(err => {
    res.send(400).send({ error: 'User id not found' });
  });
});

/**
 * Post Push recebe um USER_ID && POST_ID
 * Primeiro ele verifica as entradas. Entao ele busca no banco pelo id do post 
 * Para entao atualizar o campo PUSHES. Antes ele itera pelo array de usuários
 * Se encontrar o mesmo id no banco é descartada a query
 * PUSHES.USERS + USER_ID fornecido, TIMES + 1
 */
route.post('/push', (req, res) => {
  const { assignedTo, postId } = req.body;
  if (!assignedTo && !postId) return res.status(400).send({ error: 'Query malformated' });
  Post.findById({ _id: postId }).then(post => {
    post.pushes.users.find(user => {
      if (user == assignedTo) return res.status(400).send({ error: 'Users already push' });
    });
    const times = post.pushes.times + 1;
    const users = [...post.pushes.users, assignedTo];
    const pushes = { times, users };
    post.updateOne({ pushes }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on pushes update try again' });
      res.send();
    });
  }).catch(err => {
    res.status(400).send(err, { error: 'Post not found' });
  });
});

/**
 * Post Comment Recebe um USER_ID && POST_ID && CONTENT
 * Verifica se todos campos foram fornecidos caso nao, descarta a query
 * Entao busca pelo POST_ID no banco
 * É atualizado o campo COMMENTS com os antigos comentarios
 * E adicionado um novo objeto com conteudo e USER_ID de quem o fez
 */
route.post('/comment', (req, res) => {
  const { assignedTo, postId, content } = req.body;
  if (!assignedTo && !postId && !content) return res.status(400).send({ error: 'Query malformated' });
  Post.findById({ _id: postId }).then(post => {
    const comment = { assignedTo, content };
    const comments = [...post.comments, comment];
    post.updateOne({ comments }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on comment update, try again' });
      res.send({ message: 'Update successfully' });
    });
  }).catch(err => {
    res.status(400).send({ error: 'Post not found' });
  })
});


/**
 * Apenas lista o posts para debug
 */
route.get('/list', (req, res) => {
  Post.find()
    .populate({
      path: 'assignedTo',
      populate: {
        path: 'posts'
      }
    })
    .then(posts => {
      res.send(posts);
    });
});

/**
 * Apenas deleta todos POSTS para debug
 */
route.delete('/delete/all', (req, res) => {
  Post.deleteMany().then(() => {
    res.send({ message: 'Success' });
  });
});

route.delete('/delete/:id', (req, res) => {
  const _id = req.params.id;
  console.log(_id);

  Post.findById({ _id }).then(post => {
    console.log(post);
    User.findById({ _id: post.assignedTo }).then(user => {
      res.send();
      console.log(user);
    })
  });


});

module.exports = route;