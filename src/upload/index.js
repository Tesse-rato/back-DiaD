const multer = require('multer');
const crypto = require('crypto');
const env = require('../environment');
const User = require('../models/userModel');
const Post = require('../models/postModel');

function selectStorage(model, req, cb) {
  if (!model) {
    req.uploadError = true
    return cb(null, 'E:/diad/trash');
  }
  req.model = model;
  return cb(null, env.diskStorage);
}

const multerOptions = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const partsPath = req.path.split('/');

      if (partsPath[1] === 'profilePhoto') {
        User.findById(req.params.id).then(model => selectStorage(model, req, cb)).catch(err => cb(err));
      }
      else if (partsPath[1] === 'postPhoto') {
        Post.findById(req.params.id).then(model => selectStorage(model, req, cb)).catch(err => cb(err));
      }
    },
    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(8).toString('hex');
      const ext = file.originalname.split('.');
      cb(null, `original-${hash}.${ext[1]}`);
    }
  }),
  errorHandling: true,
};

const upload = multer(multerOptions).single('file');

module.exports = upload;