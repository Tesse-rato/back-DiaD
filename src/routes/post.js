const route = require('express').Router();
const sharp = require('sharp');
const fs = require('fs');

const Post = require('../models/postModel');
const User = require('../models/userModel');
const upload = require('../upload');
const env = require('../environment');

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
 * Upload de photo recebe no body multi-parti-form a imagem
 * Na rota recebe o POST_ID do post que vai ser atualizado
 * A imagem passa pelo middleware para ser salvo no disco
 * Apos isso vem pro controler pra ser redimencionada 
 * Apos redensionar e dar um novo nome para imagem...
 * é atualizado o campo de photo do POST
 */
route.patch('/postPhoto/:id', upload, (req, res) => {
  const { destination, filename } = req.file;
  const pathOriginal = `${destination}/${filename}`;
  const partsFileName = filename.split('-');
  const newFileName = `otimized-${partsFileName[1]}-${partsFileName[2]}`


  sharp(pathOriginal)
    .resize(600)
    .toFile(`${destination}/${newFileName}`)
    .then(() => {
      fs.unlink(pathOriginal, () => null);
      req.post.update({ photo: `${env.dbStatic}/${newFileName}` }, (err) => {
        if (err) return res.status(500).send({ error: 'Error on updating photo path' });
        res.send()
      });
    });
});

/**
 * Atualizar um post apenas recebe o POST_ID && CONTENT && USER_ID novo pra ser atualizado
 * Busca na base de dados o post em si
 * Se encontrado e aplicado o novo conteúdo no post sem alterar o restante dos campos
 */
route.put('/edit', (req, res) => {
  const { postId, content, userId } = req.body;

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });
    if (userId != post.assignedTo) return res.status(400).send({ error: 'User and assigendPost not match' });

    post.update({ content }, err => {
      if (err) return res.status(500).send({ error: 'Error on updating post, try again' });
      res.send();
    })

  }).catch(err => {
    res.status(400).send({ error: 'POST_ID malformated' });
  })
});

/**
 * Post Push recebe um USER_ID && POST_ID
 * Primeiro ele verifica as entradas. Entao ele busca no banco pelo id do post 
 * Para entao atualizar o campo PUSHES. Antes ele itera pelo array de usuários
 * Se encontrar o mesmo id no banco é descartada a query
 * PUSHES.USERS + USER_ID fornecido, TIMES + 1
 */
route.patch('/push', (req, res) => {
  const { assignedTo, postId } = req.body;
  if (!assignedTo && !postId) return res.status(400).send({ error: 'Query malformated' });

  Post.findById({ _id: postId }).then(post => {
    let exists = false;
    post.pushes.users.map(user => { user == assignedTo ? exists = true : null; });

    if (exists) return res.status(400).send({ error: 'User already pushing it' });

    const times = post.pushes.times + 1;
    const users = [...post.pushes.users, assignedTo];
    const pushes = { times, users };

    post.updateOne({ pushes }, (err) => {
      if (err) return res.status(400).send({ error: 'POST_ID malformated' });
      res.send();
    });

  }).catch(err => {
    res.status(400).send({ error: 'Post not found' });
  });
});


/**
 * Delete push recebe o POST_ID && USER_ID
 * Encontrando o post na base de dados
 * É iterado pelos PUSHES para encontrar o usuario que empurrou o post
 * Se o id for diferente do usuario que ta removendo seu push
 * É colocado num payload para atualizar o campo de pushes do post
 */
route.delete('/push', (req, res) => {
  const { postId, assignedTo } = req.body;

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    let payload = { pushes: { times: post.pushes.times, users: [] } }
    if (payload.pushes.times > 0) payload.pushes.times--;

    post.pushes.users.map(user => (user != assignedTo) ? payload.users.push(user) : null);

    post.update(payload, (err) => {
      if (err) return res.status(500).send({ error: 'Error on pushes update, try again' });
      res.send();
    });

  }).catch(err => {
    console.log(err);
    res.status(400).send({ error: 'Push_id malformated' });
  })
});

/**
 * Post Comment Recebe um USER_ID && POST_ID && CONTENT
 * Verifica se todos campos foram fornecidos caso nao, descarta a query
 * Entao busca pelo POST_ID no banco
 * É atualizado o campo COMMENTS com os antigos comentarios
 * E adicionado um novo objeto com conteudo e USER_ID de quem o fez
 */
route.patch('/comment', (req, res) => {
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
  Post.find().then(posts => {
    res.send(posts);
  });
});

/**
 * Delete um post por ID recebe o POST_ID
 * Busca na base pelo post referente ao id
 * Se encontra ele busca o usuario assinado ao post
 * Itera pelos posts do usuario
 * Referencia uma variavel apenas com os posts diferente do POST_ID
 * Depois atualiza o usuário com a nova lista de posts sem aquele post
 */
route.delete('/delete/:id', (req, res) => {
  Post.findByIdAndRemove({ _id: req.params.id }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    const partsNamePhoto = post.photo.split('/');
    fs.unlink(`${env.diskStorage}/${partsNamePhoto[3]}`, () => null);
    User.findById({ _id: post.assignedTo }).then(user => {
      console.log(user, 'USER');
      const userPosts = user.posts;
      const newPosts = []
      userPosts.find(post => {
        if (post != post._id) newPosts = post;
      });
      user.updateOne({ posts: newPosts }, (err) => {
        if (err) return res.status(500).send({ error: 'Error on update user posts, try again' });
        return res.send();
      });
    });
  }).catch(err => {
    res.status(400).send({ error: 'Post not found' });
  });
});


/**
 * Delete comment Recebe um POST_ID no parametro da rota
 * No body da requisição ele recebe o COMMENT_ID que sera removido
 * É buscado no banco de dados o post que contem o comentario a ser removido
 * Se encontrado o campo de comments do post é iterado
 * Um payload recebe todos comentarios que forem diferente do COMMENT_ID a ser removido
 * No final o post é atualizado com o novo payload
 */
route.delete('/comment', (req, res) => {
  const { commentId, postId } = req.body;

  Post.findOne({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    let payload = [];
    post.comments.map(comment => { if (comment._id != commentId) payload.push(comment); });

    post.update({ comments: payload }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on comments update, try again' });
      res.send()
    });

  }).catch(err => {
    console.log(err);
    res.status(400).send({ error: 'Id malformated' });
  });
});

/**
 * Apenas deleta todos POSTS para debug
 */
route.delete('/delete_all', (req, res) => {
  Post.deleteMany().then(() => {
    res.send({ message: 'Success' });
  });
});

module.exports = route;