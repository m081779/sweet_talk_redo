const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const socketSchema = new Schema({
  userName: {
    type: String,
    unique: true,
    required: [true, 'Username is required']
  },
  socketId: {
    type: String,
    required: [true, 'Socket ID is required']
  }
});

const Socket = module.exports = mongoose.model('Socket', socketSchema);
