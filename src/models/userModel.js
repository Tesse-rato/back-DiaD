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
    }
})

userModel.pre('save', function (next) {
    bcrypt.hash(this.password, 10, (err, hashPassword) => {
        if (err) throw new Error;

        this.password = hashPassword;

        next();
    })
})

module.exports = mongoose.model('User', userModel);