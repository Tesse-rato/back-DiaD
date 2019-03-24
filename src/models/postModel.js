const mongoose = require('../database');

const postSchema = new mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  pushes: {
    times: {
      type: Number,
      default: 0,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  comments: [{
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
    },
    commentAt: {
      type: Date,
      default: Date.now()
    }
  }],
  content: {
    type: String,
    required: true,
  },
  photo: {
    width: String,
    height: String,
    content: String,
  }
})

module.exports = mongoose.model('Post', postSchema);