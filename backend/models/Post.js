const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:    { type: String, required: true },
    text:    { type: String, required: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['farmer', 'customer'], required: true },
    text:       { type: String, default: '' },
    image:      { type: String, default: '' },
    likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments:   [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
