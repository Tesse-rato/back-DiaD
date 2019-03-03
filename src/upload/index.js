const multer = require('multer');
const crypto = require('crypto');
const env = require('../environment');
const User = require('../models/userModel');

const multerOptions = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      User.findById(req.params.id).then((user) => {
        if (!user) {
          req.uploadError = true
          return cb(null, 'E:/diad/trash');
        }
        req.user = user;
        return cb(null, env.diskStorage);
      }).catch(err => {
        console.log('err');
        return cb(err);
      })
    },
    filename: (req, file, cb) => {
      const hash = crypto.randomBytes(8).toString('hex');
      const fileName = file.originalname;
      cb(null, `original-${hash}-${fileName}`);
    }
  }),
  errorHandling: true,
};

const upload = multer(multerOptions).single('file');

module.exports = upload;