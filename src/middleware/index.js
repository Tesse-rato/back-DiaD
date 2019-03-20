const authorization = require('./authorization');
const generateLog = require('./generateLog');

const allowedRoutes = ['auth', 'create', 'reset_password', 'forgot_password', 'exists', 'confirm'];
const tokenRoutes = [
  'list', 'create', 'push',
  'comment', 'delete', 'delete_all',
  'profilePhoto', 'edit', 'postPhoto',
  'follow', 'unfollow', 'validateToken',
  'editComment', 'profile', 'nicknameExists'
];

module.exports = (req, res, next) => {
  const route = req.path.split('/');

  if (route[1] === 'users') {
    if (allowedRoutes.find(rout => rout === route[2])) {
      return next();
    } else if (tokenRoutes.find(rout => rout == route[2])) {
      return authorization(req, res, next);
    }
    else {
      return generateLog(req, res);
    }
  }
  else if (route[1] === 'posts') {
    if (tokenRoutes.find(rout => rout === route[2])) {
      return authorization(req, res, next);
    }
    else {
      return generateLog(req, res);
    }
  }
  else {
    return generateLog(req, res);
  }
}