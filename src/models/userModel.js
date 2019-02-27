const mongoose = require('../database/index');
const bcrypt = require('bcryptjs');

const userModel = new mongoose.Schema({
  name: {
    first: {
      type: String,
      required: true,
    },
    last: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  tokenForgotPassword: {
    type: String,
    select: false
  },
  tokenForgotExpires: {
    type: String,
    select: false
  }
})

userModel.pre('save', function (next) {
  try {
    bcrypt.hash(this.password, 10, (err, hashPassword) => {
      if (err) throw new Error;

      this.password = hashPassword;

      return next();
    })
  } catch (err) {
    console.log(err, { error: 'Error on encrypt password' });
  }
})

module.exports = mongoose.model('User', userModel);