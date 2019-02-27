const mongoose = require('mongoose');
const env = require('../environment')

mongoose.connect(env.dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true
});

module.exports = mongoose;