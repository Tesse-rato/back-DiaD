const route = require('express').Router();
const sharp = require('sharp');
const fs = require('fs');

const Post = require('../models/postModel');
const User = require('../models/userModel');
const upload = require('../upload');
const env = require('../environment');

route.post('/create', (req, res) => {
  /**
   * Criando um post recebe um USER_ID para assinar ao post
   * Primeiro valida se todas entradas foram recebidas antes de levar ao banco
   * Busca no banco pelo ID fornecido, se existir ele tenta criar um novo Post
   * Ao sucesso da criação do post o usuario é atualizado com o ID retornado...
   */
  const { assignedTo, content, category } = req.body;
  if (!assignedTo) return res.status(400).send({ error: 'No User provided' });
  if (!category) return res.status(400).send({ error: 'Category not provided' });

  User.findById({ _id: assignedTo }).then(user => {
    if (!user) return res.status(400).send({ error: 'User not found' });

    Post.create({ assignedTo, content, category }).then(post => {
      const posts = user.posts;
      posts.push(post._id);

      user.update({ posts }, (err) => {
        if (err) return res.status(500).send({ error: 'Error on user update, try again' });

        return res.send(post);
      });

    }).catch(err => res.status(500).send({ error: 'Error on post create, try again' }));
  }).catch(err => res.status(400).send({ error: 'Request malformated' }));
});
route.patch('/postPhoto/:id', upload, (req, res) => {
  /**
   * Upload de photo recebe no body multi-parti-form a imagem
   * Na rota recebe o POST_ID do post que vai ser atualizado
   * A imagem passa pelo middleware para ser salvo no disco
   * Apos isso vem pro controler pra ser redimencionada 
   * Apos redensionar e dar um novo nome para imagem...
   * é atualizado o campo de photo do POST
   */
  if (req.uploadError) return res.status(400).send({ error: 'Post not found' });

  const { photo } = req.model;

  if (photo.content) {
    const pathToPhoto = photo.content.split('/');
    fs.unlink(`${env.diskStorage}/${pathToPhoto[3]}`, (err) => console.log(err));
  }

  const { destination, filename } = req.file;
  const pathOriginal = `${destination}/${filename}`;
  const partsFileName = filename.split('-');
  const newFileName = `optimized-${partsFileName[1]}`;

  fs.readFile(pathOriginal, (err, buffer) => {
    if (err) return res.status(500).send({ error: 'Error on read file to resize' });

    sharp(buffer)
      .resize(600)
      .toFile(`${destination}/${newFileName}`)
      .then(info => {

        if (pathOriginal) {
          fs.unlink(pathOriginal, () => null);
        }

        req.model.update({
          photo: {
            width: info.width,
            height: info.height,
            content: `${env.dbStatic}/${newFileName}`,
          }
        }, (err) => {
          if (err) return res.status(500).send({ error: 'Error on updating photo path' });

          res.send({ content: env.dbStatic + '/' + newFileName, width: info.width, height: info.height });
        });
      }).catch(err => res.status(500).send({ error: 'Error on resize image try again' }));
  });
});
route.put('/edit', (req, res) => {
  /**
   * Atualizar um post apenas recebe o POST_ID && CONTENT && USER_ID novo pra ser atualizado
   * Busca na base de dados o post em si
   * Se encontrado e aplicado o novo conteúdo no post sem alterar o restante dos campos
   */
  const { postId, content, userId, category } = req.body;

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });
    if (userId != post.assignedTo) return res.status(400).send({ error: 'User and assigendPost not match' });

    post.update({ content, category }, err => {
      if (err) return res.status(500).send({ error: 'Error on updating post, try again' });
      res.send();
    });

  }).catch(err => res.status(400).send({ error: 'POST_ID malformated' }));
});
route.patch('/push', (req, res) => {
  /**
   * Post Push recebe um USER_ID && POST_ID
   * Primeiro ele verifica as entradas. Entao ele busca no banco pelo id do post 
   * Para entao atualizar o campo PUSHES. Antes ele itera pelo array de usuários
   * Se encontrar o mesmo id no banco é descartada a query
   * PUSHES.USERS + USER_ID fornecido, TIMES + 1
   */
  const { assignedTo, postId } = req.body;
  if (!assignedTo && !postId) return res.status(400).send({ error: 'Request malformated' });

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    for (let user of post.pushes.users) {
      if (user == assignedTo) return res.status(400).send({ error: 'User already pushing it' });
    }

    const times = post.pushes.times + 1;
    const users = [...post.pushes.users, assignedTo];
    const pushes = { times, users };

    post.updateOne({ pushes }, (err) => {
      if (err) return res.status(400).send({ error: 'POST_ID malformated' });
      res.send();
    });

  }).catch(err => res.status(400).send({ error: 'Post not found' }));
});
route.delete('/push', (req, res) => {
  /**
   * Delete push recebe o POST_ID && USER_ID
   * Encontrando o post na base de dados
   * É iterado pelos PUSHES para encontrar o usuario que empurrou o post
   * Se o id for diferente do usuario que ta removendo seu push
   * É colocado num payload para atualizar o campo de pushes do post
   */
  const { postId, assignedTo } = req.body;

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    let payload = post;

    payload.pushes.times > 0 ? payload.pushes.times-- : null;

    let usersPushed = [];

    usersPushed = post.pushes.users.filter(user => user.toString() != assignedTo);

    payload.pushes.users = usersPushed;

    post.update(payload, (err) => {
      if (err) return res.status(500).send({ error: 'Error on pushes update, try again' });
      res.send();
    });

  }).catch(err => res.status(400).send({ error: 'Push_id malformated' }));
});
route.patch('/comment', (req, res) => {
  /**
   * Post Comment Recebe um USER_ID && POST_ID && CONTENT
   * Verifica se todos campos foram fornecidos caso nao, descarta a query
   * Entao busca pelo POST_ID no banco
   * É atualizado o campo COMMENTS com os antigos comentarios
   * E adicionado um novo objeto com conteudo e USER_ID de quem o fez
   */
  const { assignedTo, postId, content } = req.body;

  if (!assignedTo && !postId && !content) return res.status(400).send({ error: 'Query malformated' });

  Post.findById({ _id: postId }).then(post => {

    const comment = { assignedTo, content };
    const comments = [comment, ...post.comments];

    post.update({ comments }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on comment update, try again' });

      Post.findById({ _id: post._id })
        .populate({ path: 'comments.assignedTo', select: 'photo name' })
        .then(post => {
          res.send(post.comments[0]);
        });
    });

  }).catch(err => res.status(400).send({ error: 'Post not found' }));
});
route.patch('/editComment', (req, res) => {
  /**
   * EditComment rece um POST_ID && COMMENT_ID && CONTENT
   * Busca no banco se aquele post existe, se nao é é rejeitada a requisicao
   * É descoberto o index do comentario naquele post
   * Um payload com uma do post recebe a aoteração no index do comentario com o novo conteudo
   * O campo de comentarios do post é substituido pelo payload alterado
   */
  const { postId, commentId, content } = req.body;

  Post.findById({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    let indexOfComment;
    let payload = post.comments;

    post.comments.forEach((comment, index) => {
      comment._id.toString() == commentId ? indexOfComment = index : null;
    });

    payload[indexOfComment].content = content;

    post.update({ comments: payload }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on updating post, try again' });

      res.send();
    });

  }).catch(err => res.status(400).send({ error: 'Request malformated' }));
});
route.get('/list/:category', (req, res) => {
  /**
   * Apenas lista o posts para debug
   */
  const category = req.params.category;

  Post.find({ category })
    .populate({ path: 'assignedTo', select: 'photo name' })
    .populate({ path: 'comments.assignedTo', select: 'photo name' })


    .then(posts => {
      res.send(posts);
    });
});
route.get('/list/favorites/:id', (req, res) => {
  /**
   * List Favorites recebe o ID do Usuario
   * Busca no banco por um usuario com aquele ID
   * Se existir é iterado pelo seu campo Followers
   * Requisitando no banco cada ID que que o usuario obtenha no campo followers
   * É reunido todas os posts de todos usuarios contidos no campo followers
   * É agrupado em um unico array de documento e retornado na resposta
   */
  const _id = req.params.id;

  User.findOne({ _id }).then(user => {
    if (!user) return res.status(400).send({ error: 'User not found' });

    User.find({ _id: user.following }).then(users => {

      let usersPostStack = [];
      let postStack = [];

      users.map(user => {
        usersPostStack.push(user.posts);
      })

      usersPostStack.map(uniqueArrayPost => {
        uniqueArrayPost.map(_id => {
          postStack.push(_id);
        });
      });

      Post.find({ _id: postStack }).populate({ path: 'assignedTo comments.assignedTo', select: 'name photo' })
        .then(posts => {
          res.send(posts);
        });
    });


  }).catch(err => res.status(400).send({ error: 'Request malformated' }));
});
route.delete('/delete', (req, res) => {
  /**
   * Delete um post por ID recebe o POST_ID
   * Busca na base pelo post referente ao id
   * Se encontra ele busca o usuario assinado ao post
   * Itera pelos posts do usuario
   * Referencia uma variavel apenas com os posts diferente do POST_ID
   * Depois atualiza o usuário com a nova lista de posts sem aquele post
   */
  Post.findById({ _id: req.body.id }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not foundeeeee' });

    if (post.photo.content) {
      const partsNamePhoto = post.photo.content.split('/');
      fs.unlink(`${env.diskStorage}/${partsNamePhoto[3]}`, () => null);
    }

    User.findById({ _id: post.assignedTo }).then(user => {
      if (!user) return res.status(206).send({ error: 'Error to find user on data base' });

      let payload = user.posts.filter(userPost => userPost.toString() != post._id.toString());

      user.update({ posts: payload }, (err) => {
        if (err) return res.status(500).send({ error: 'Error on update user posts, try again' });
        Post.findOneAndRemove({ _id: post._id }).then(() => res.send());
      });

    }).catch(err => res.status(400).send({ error: 'User assigned to post not found on data base' }));
  }).catch(err => {
    console.log(err);
    res.status(400).send({ error: 'Request malformated' })
  });
});
route.delete('/comment', (req, res) => {
  /**
   * Delete comment Recebe um POST_ID no parametro da rota
   * No body da requisição ele recebe o COMMENT_ID que sera removido
   * É buscado no banco de dados o post que contem o comentario a ser removido
   * Se encontrado o campo de comments do post é iterado
   * Um payload recebe todos comentarios que forem diferente do COMMENT_ID a ser removido
   * No final o post é atualizado com o novo payload
   */
  const { commentId, postId } = req.body;

  Post.findOne({ _id: postId }).then(post => {
    if (!post) return res.status(400).send({ error: 'Post not found' });

    let payload = [];

    payload = post.comments.filter(comment => comment._id.toString() != commentId);

    post.update({ comments: payload }, (err) => {
      if (err) return res.status(500).send({ error: 'Error on comments update, try again' });
      res.send()
    });
  }).catch(err => res.status(400).send({ error: 'Id malformated' }));
});
route.delete('/delete_all', (req, res) => {
  /**
   * Apenas deleta todos POSTS para debug
   */
  Post.deleteMany().then(() => {
    res.send({ message: 'Success' });
  });
});

module.exports = route;